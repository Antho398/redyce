/**
 * Route API pour générer une réponse de section
 * POST /api/memoire/sections/[id]/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const sectionId = params.id

  logOperationStart('Memory Section Generate', {
    userId,
    sectionId,
  })

  try {
    const answer = await memorySectionService.generateSectionAnswer(sectionId, userId)

    logOperationSuccess('Memory Section Generate', {
      userId,
      sectionId,
      answerId: answer.id,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: answer,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Memory Section Generate', error as Error, {
      userId,
      sectionId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate answer',
        },
      },
      { status: 500 }
    )
  }
}

