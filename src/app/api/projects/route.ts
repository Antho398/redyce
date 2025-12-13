/**
 * Route API pour la gestion des projets
 * GET /api/projects - Liste des projets
 * POST /api/projects - Créer un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project-service'
import { createProjectSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function GET() {
  try {
    const userId = await requireAuth()
    const projects = await projectService.getUserProjects(userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch projects',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const data = createProjectSchema.parse(body)

    const project = await projectService.createProject(userId, data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to create project',
        },
      },
      { status: 500 }
    )
  }
}

