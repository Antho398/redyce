/**
 * Route API pour mettre à jour une réponse de section
 * PUT /api/memoire/answers/[sectionId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { updateSectionAnswerSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  const userId = await requireAuth()
  const sectionId = params.sectionId
  const body = await request.json()

  const { contentHtml, status } = updateSectionAnswerSchema.parse(body)

  try {
    const answer = await memorySectionService.updateAnswer(sectionId, contentHtml, status, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: answer,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update answer',
        },
      },
      { status: 500 }
    )
  }
}

