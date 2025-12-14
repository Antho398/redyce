/**
 * Route API pour l'extraction d'exigences depuis les documents d'un projet
 * POST /api/requirements/extract
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { requirementService } from '@/services/requirement-service'
import { extractRequirementsSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { documentService } from '@/services/document-service'

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

    const { projectId } = extractRequirementsSchema.parse(body)

    // Vérifier que le projet existe et appartient à l'utilisateur
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Project not found',
          },
        },
        { status: 404 }
      )
    }

    if (project.userId !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: You do not have access to this project',
          },
        },
        { status: 403 }
      )
    }

    // Récupérer les documents du projet de type AE, RC, CCAP, CCTP, DPGF
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        documentType: {
          in: ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF'],
        },
        status: 'processed', // Seulement les documents traités
      },
      include: {
        analyses: {
          where: {
            status: 'completed',
            analysisType: 'extraction',
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (documents.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message:
              'Aucun document traité trouvé. Veuillez d\'abord analyser vos documents (AE, RC, CCAP, CCTP, DPGF).',
          },
        },
        { status: 400 }
      )
    }

    // Extraire les exigences de chaque document
    const allRequirements = []
    for (const document of documents) {
      try {
        if (document.analyses.length > 0 && document.analyses[0].result) {
          const requirements = await requirementService.extractRequirements(
            document.id,
            userId
          )
          allRequirements.push(...requirements)
        }
      } catch (error) {
        console.error(`Error extracting requirements from document ${document.id}:`, error)
        // Continuer avec les autres documents même en cas d'erreur
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          requirements: allRequirements,
          count: allRequirements.length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error extracting requirements:', error)

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
          message: error instanceof Error ? error.message : 'Failed to extract requirements',
        },
      },
      { status: 500 }
    )
  }
}

