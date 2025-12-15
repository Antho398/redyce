/**
 * Route API pour la gestion des commentaires
 * POST /api/comments - Crée un commentaire
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { collaborationService } from '@/services/collaboration-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const createCommentSchema = z.object({
  memoireSectionId: z.string().min(1),
  content: z.string().min(1, 'Comment content is required'),
  parentCommentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
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
    const body = await request.json()

    const validatedData = createCommentSchema.parse(body)

    const comment = await collaborationService.createComment(userId, {
      ...validatedData,
      authorId: userId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: comment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create comment',
        },
      },
      { status: 500 }
    )
  }
}

