/**
 * Route API pour récupérer les commentaires d'une section
 * GET /api/sections/[id]/comments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { collaborationService } from '@/services/collaboration-service'
import { ApiResponse } from '@/types/api'

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
    const sectionId = params.id

    const comments = await collaborationService.getSectionComments(sectionId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: comments,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching section comments:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch comments',
        },
      },
      { status: 500 }
    )
  }
}

