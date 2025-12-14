/**
 * Route API pour mapper les exigences aux sections
 * POST /api/analysis/requirements/map
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirementService } from '@/services/requirement-service'
import { mapRequirementsSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId } = mapRequirementsSchema.parse(body)

  logOperationStart('Requirements Map', {
    userId,
    projectId,
  })

  try {
    const links = await requirementService.mapRequirementsToSections(projectId, userId)

    logOperationSuccess('Requirements Map', {
      userId,
      projectId,
      linksCount: links.length,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: links,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Requirements Map', error as Error, {
      userId,
      projectId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to map requirements',
        },
      },
      { status: 500 }
    )
  }
}

