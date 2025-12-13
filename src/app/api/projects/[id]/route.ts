/**
 * Route API pour un projet spécifique
 * GET /api/projects/[id] - Récupérer un projet
 * PUT /api/projects/[id] - Mettre à jour un projet
 * DELETE /api/projects/[id] - Supprimer un projet
 */

import { requireAuth } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project-service'
import { updateProjectSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const project = await projectService.getProjectById(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch project',
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
    const userId = await requireAuth()
    const body = await request.json()
    const data = updateProjectSchema.parse(body)

    const project = await projectService.updateProject(params.id, userId, data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Error updating project:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update project',
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
    const userId = await requireAuth()
    await projectService.deleteProject(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete project',
        },
      },
      { status: 500 }
    )
  }
}

