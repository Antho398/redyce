/**
 * Route API pour la gestion des exigences
 * GET /api/requirements - Liste des exigences d'un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { requirementService } from '@/services/requirement-service'
import { getRequirementsQuerySchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

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

    const requirements = await requirementService.getProjectRequirements(
      query.projectId,
      userId
    )

    // Filtrer par catégorie et statut si fournis
    let filtered = requirements
    if (query.category) {
      filtered = filtered.filter((r) => r.category === query.category)
    }
    if (query.status) {
      filtered = filtered.filter((r) => r.status === query.status)
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: filtered,
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

