/**
 * Route API pour générer toutes les réponses d'un projet
 * POST /api/memoire/sections/generate-all
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { z } from 'zod'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

const generateAllSchema = z.object({
  projectId: z.string().cuid(),
})

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId } = generateAllSchema.parse(body)

  logOperationStart('Memory Generate All', {
    userId,
    projectId,
  })

  try {
    const results = await memorySectionService.generateAllAnswers(projectId, userId)

    logOperationSuccess('Memory Generate All', {
      userId,
      projectId,
      resultsCount: results.length,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: results,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Memory Generate All', error as Error, {
      userId,
      projectId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate all answers',
        },
      },
      { status: 500 }
    )
  }
}

