/**
 * Route API pour l'extraction manuelle des exigences
 * POST /api/documents/[id]/extract-requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireProjectAccess } from '@/lib/utils/project-access'
import { requirementExtractionJob } from '@/services/requirement-extraction-job'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const { id: documentId } = params

  logOperationStart('Extract Requirements (Manual)', {
    userId,
    documentId,
  })

  try {
    // Récupérer le document et vérifier l'accès
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
      },
    })

    if (!document) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Document not found' },
        },
        { status: 404 }
      )
    }

    // Vérifier l'accès au projet
    await requireProjectAccess(document.projectId, userId)

    // Vérifier que le document n'est pas déjà en cours d'extraction
    if (document.requirementStatus === 'PROCESSING') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Extraction already in progress for this document' },
        },
        { status: 409 }
      )
    }

    // Marquer comme en attente
    requirementExtractionJob.enqueueDocument(documentId)

    // Lancer l'extraction en arrière-plan (non bloquant)
    setImmediate(async () => {
      try {
        await requirementExtractionJob.extractForDocument(documentId, userId)
        console.log(`[Extract Requirements Manual] Successfully extracted requirements for document ${documentId}`)
      } catch (error) {
        console.error(`[Extract Requirements Manual] Error extracting requirements for document ${documentId}:`, error)
      }
    })

    logOperationSuccess('Extract Requirements (Manual)', {
      userId,
      documentId,
      projectId: document.projectId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          documentId,
          status: 'PROCESSING',
          message: 'Extraction des exigences lancée en arrière-plan',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Extract Requirements (Manual)', error as Error, {
      userId,
      documentId,
    })

    const message = error instanceof Error ? error.message : 'Failed to extract requirements'
    const status =
      message.includes('not found') ? 404 :
      message.includes('access') ? 403 : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status }
    )
  }
}
