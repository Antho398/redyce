/**
 * Route API pour lier une exigence à une section de mémoire
 * POST /api/requirements/[id]/link
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { linkRequirementToSectionSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const requirementId = params.id
    const body = await request.json()

    const { sectionId } = linkRequirementToSectionSchema.parse(body)

    // Vérifier que l'exigence existe et appartient à l'utilisateur
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: true,
      },
    })

    if (!requirement) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Requirement not found',
          },
        },
        { status: 404 }
      )
    }

    if (requirement.project.userId !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: You do not have access to this requirement',
          },
        },
        { status: 403 }
      )
    }

    // Vérifier que la section existe et appartient au même projet
    const section = await prisma.memoireSection.findUnique({
      where: { id: sectionId },
      include: {
        memoire: true,
      },
    })

    if (!section) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Section not found',
          },
        },
        { status: 404 }
      )
    }

    if (section.memoire.projectId !== requirement.projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Section does not belong to the same project',
          },
        },
        { status: 400 }
      )
    }

    // Vérifier si le lien existe déjà
    const existingLink = await prisma.requirementLink.findUnique({
      where: {
        sectionId_requirementId: {
          sectionId,
          requirementId,
        },
      },
    })

    if (existingLink) {
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: existingLink,
        },
        { status: 200 }
      )
    }

    // Créer le lien
    const link = await prisma.requirementLink.create({
      data: {
        sectionId,
        requirementId,
        relevance: 1.0, // Pertinence maximale pour un lien manuel
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: link,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error linking requirement to section:', error)

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
          message: error instanceof Error ? error.message : 'Failed to link requirement to section',
        },
      },
      { status: 500 }
    )
  }
}

