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

// Récupère le résumé d'état des documents pour un projet (tous types)
async function getDocumentStatusSummary(projectId: string) {
  const documents = await prisma.document.findMany({
    where: {
      projectId,
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
      priority: searchParams.get('priority') || undefined,
      documentType: searchParams.get('documentType') || undefined,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
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
    
    // Par défaut, exclure SUPPRIMEE sauf si explicitement demandé
    if (query.status === 'SUPPRIMEE') {
      // Afficher uniquement les supprimées
      filtered = filtered.filter((r) => r.status === 'SUPPRIMEE')
    } else {
      // Exclure SUPPRIMEE par défaut
      filtered = filtered.filter((r) => r.status !== 'SUPPRIMEE')
      if (query.status) {
        filtered = filtered.filter((r) => r.status === query.status)
      }
    }
    
    if (query.category) {
      filtered = filtered.filter((r) => r.category === query.category)
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

    // Pagination côté serveur
    const totalItems = filtered.length
    const page = query.page || 1
    const limit = query.limit === 1000 ? totalItems : (query.limit || 25) // Si limit=1000, on considère "Tout"
    const totalPages = limit >= totalItems ? 1 : Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit
    const paginatedRequirements = limit >= totalItems ? filtered : filtered.slice(skip, skip + limit)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          requirements: paginatedRequirements,
          documentStatus,
          pagination: {
            total: totalItems,
            page,
            limit: limit >= totalItems ? totalItems : limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
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
    const body = await request.json()

    const { projectId, title, description, category, priority, status } = body

    if (!projectId || !title) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'projectId and title are required',
          },
        },
        { status: 400 }
      )
    }

    // Vérifier que le projet appartient à l'utilisateur
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Project not found or access denied',
          },
        },
        { status: 404 }
      )
    }

    // Créer l'exigence
    const requirement = await prisma.requirement.create({
      data: {
        projectId,
        title,
        description: description || '',
        category: category || undefined,
        priority: priority || undefined,
        status: status || 'A_TRAITER',
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            fileName: true,
            documentType: true,
          },
        },
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: requirement,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating requirement:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create requirement',
        },
      },
      { status: 500 }
    )
  }
}

