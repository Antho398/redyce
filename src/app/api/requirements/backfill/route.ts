/**
 * Route API pour le backfill des exigences
 * POST /api/requirements/backfill - Lance l'extraction pour tous les documents AO non traités
 * 
 * Cette route est utilisée pour :
 * - Traiter les documents AO existants uploadés avant l'implémentation de l'extraction auto
 * - Relancer l'extraction pour les documents en erreur
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { requirementExtractionJob, AO_DOCUMENT_TYPES } from '@/services/requirement-extraction-job'
import { ApiResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json().catch(() => ({}))
    const { projectId, includeErrors = false } = body

    // Construire la requête
    const whereClause: any = {
      documentType: { in: AO_DOCUMENT_TYPES as unknown as string[] },
      project: {
        userId, // Sécurité : uniquement les projets de l'utilisateur
      },
    }

    // Filtrer par projet si spécifié
    if (projectId) {
      whereClause.projectId = projectId
    }

    // Statuts à traiter
    const statusesToProcess = ['WAITING', null]
    if (includeErrors) {
      statusesToProcess.push('ERROR')
    }

    whereClause.OR = [
      { requirementStatus: 'WAITING' },
      { requirementStatus: null },
    ]

    if (includeErrors) {
      whereClause.OR.push({ requirementStatus: 'ERROR' })
    }

    // Récupérer les documents à traiter
    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        documentType: true,
        requirementStatus: true,
        projectId: true,
      },
    })

    console.log(`[Backfill] Found ${documents.length} documents to process`)

    // Enqueue tous les documents
    for (const doc of documents) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { requirementStatus: 'WAITING' },
      })
    }

    // Lancer l'extraction en arrière-plan pour chaque document
    const results: Array<{ documentId: string; name: string; status: string }> = []

    // Note: Dans un vrai environnement de production, on utiliserait un job queue
    // Ici on lance en parallèle avec une limite de concurrence
    const CONCURRENCY = 3
    const batches = []
    for (let i = 0; i < documents.length; i += CONCURRENCY) {
      batches.push(documents.slice(i, i + CONCURRENCY))
    }

    // Traiter le premier batch immédiatement, le reste en arrière-plan
    if (batches.length > 0) {
      const firstBatch = batches[0]
      const promises = firstBatch.map(async (doc) => {
        try {
          const result = await requirementExtractionJob.extractForDocument(doc.id, userId)
          return {
            documentId: doc.id,
            name: doc.name,
            status: result.success ? 'DONE' : 'ERROR',
            created: result.requirementsCreated,
            skipped: result.requirementsSkipped,
            error: result.error,
          }
        } catch (error) {
          return {
            documentId: doc.id,
            name: doc.name,
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      const batchResults = await Promise.all(promises)
      results.push(...batchResults)

      // Traiter les batches restants en arrière-plan
      if (batches.length > 1) {
        setImmediate(async () => {
          for (let i = 1; i < batches.length; i++) {
            const batch = batches[i]
            await Promise.all(
              batch.map((doc) =>
                requirementExtractionJob.extractForDocument(doc.id, userId).catch((err) => {
                  console.error(`[Backfill] Error processing ${doc.id}:`, err)
                })
              )
            )
          }
        })
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          message: `Backfill lancé pour ${documents.length} document(s)`,
          totalDocuments: documents.length,
          processedImmediately: results.length,
          processingInBackground: Math.max(0, documents.length - results.length),
          results,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Backfill] Error:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to run backfill',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/requirements/backfill - Récupère l'état du backfill
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Construire la requête
    const whereClause: any = {
      documentType: { in: AO_DOCUMENT_TYPES as unknown as string[] },
      project: {
        userId,
      },
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    // Compter les documents par statut
    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        documentType: true,
        requirementStatus: true,
        requirementProcessedAt: true,
        requirementErrorMessage: true,
      },
    })

    const summary = {
      total: documents.length,
      waiting: documents.filter((d) => d.requirementStatus === 'WAITING').length,
      processing: documents.filter((d) => d.requirementStatus === 'PROCESSING').length,
      done: documents.filter((d) => d.requirementStatus === 'DONE').length,
      error: documents.filter((d) => d.requirementStatus === 'ERROR').length,
      notStarted: documents.filter((d) => !d.requirementStatus).length,
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.documentType,
        status: d.requirementStatus || 'NOT_STARTED',
        processedAt: d.requirementProcessedAt,
        error: d.requirementErrorMessage,
      })),
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: summary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Backfill Status] Error:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get backfill status',
        },
      },
      { status: 500 }
    )
  }
}

