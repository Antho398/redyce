/**
 * Route API pour récupérer les sections d'un projet
 * GET /api/memoire/sections?projectId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const userId = await requireAuth()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
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

  try {
    const sections = await memorySectionService.getProjectSections(projectId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: sections,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch sections',
        },
      },
      { status: 500 }
    )
  }
}

