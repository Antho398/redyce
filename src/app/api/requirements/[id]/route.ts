/**
 * Route API pour la gestion d'une exigence spécifique
 * GET /api/requirements/[id] - Détails d'une exigence
 * PUT /api/requirements/[id] - Mettre à jour une exigence
 * DELETE /api/requirements/[id] - Supprimer une exigence
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { requirementService } from '@/services/requirement-service'
import { updateRequirementSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'

export async function GET(
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

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            fileName: true,
            documentType: true,
          },
        },
        sectionLinks: {
          include: {
            section: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
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

    // Vérifier l'accès au projet
    const project = await prisma.project.findUnique({
      where: { id: requirement.projectId },
    })

    if (!project || project.userId !== userId) {
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

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: requirement,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching requirement:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch requirement',
        },
      },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const updateData = updateRequirementSchema.parse(body)

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

    // Mettre à jour l'exigence
    const updated = await prisma.requirement.update({
      where: { id: requirementId },
      data: updateData,
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
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating requirement:', error)

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
          message: error instanceof Error ? error.message : 'Failed to update requirement',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await requirementService.deleteRequirement(requirementId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: requirementId },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting requirement:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete requirement',
        },
      },
      { status: 500 }
    )
  }
}

