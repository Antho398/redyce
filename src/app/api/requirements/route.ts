/**
 * Route API pour la gestion des exigences
 * GET /api/requirements - Liste des exigences d'un projet + résumé d'état
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { requirementService } from '@/services/requirement-service'
import { getRequirementsQuerySchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { AO_DOCUMENT_TYPES } from '@/services/requirement-extraction-job'

// Récupère le résumé d'état des documents AO pour un projet
async function getDocumentStatusSummary(projectId: string) {
  const documents = await prisma.document.findMany({
    where: {
      projectId,
      documentType: { in: AO_DOCUMENT_TYPES as unknown as string[] },
    },
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
    totalDocsAO: documents.length,
    waiting: documents.filter((d) => d.requirementStatus === 'WAITING').length,
    processing: documents.filter((d) => d.requirementStatus === 'PROCESSING').length,
    done: documents.filter((d) => d.requirementStatus === 'DONE').length,
    error: documents.filter((d) => d.requirementStatus === 'ERROR').length,
    notProcessed: documents.filter((d) => !d.requirementStatus).length,
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.documentType,
      status: d.requirementStatus || 'NOT_STARTED',
      processedAt: d.requirementProcessedAt,
      error: d.requirementErrorMessage,
    })),
  }

  return summary
}

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

    const query = getRequirementsQuerySchema.parse({
      projectId: searchParams.get('projectId') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
    })

    if (!query.projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'projectId is required',
          },
        },
        { status: 400 }
      )
    }

    // Récupérer les exigences
    const requirements = await requirementService.getProjectRequirements(
      query.projectId,
      userId
    )

    // Récupérer le résumé d'état des documents AO
    const documentStatus = await getDocumentStatusSummary(query.projectId)

    // Filtrer par catégorie, statut, priorité, type de document et recherche textuelle
    let filtered = requirements
    if (query.category) {
      filtered = filtered.filter((r) => r.category === query.category)
    }
    if (query.status) {
      filtered = filtered.filter((r) => r.status === query.status)
    }
    if (query.priority) {
      filtered = filtered.filter((r) => r.priority === query.priority)
    }
    if (query.documentType) {
      filtered = filtered.filter((r) => r.document?.documentType === query.documentType)
    }
    if (query.q) {
      const searchQuery = query.q.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery) ||
          r.description.toLowerCase().includes(searchQuery) ||
          r.code?.toLowerCase().includes(searchQuery) ||
          r.sourceQuote?.toLowerCase().includes(searchQuery)
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          requirements: filtered,
          documentStatus,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching requirements:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch requirements',
        },
      },
      { status: 500 }
    )
  }
}

