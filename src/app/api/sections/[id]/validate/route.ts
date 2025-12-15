/**
 * Route API pour valider une section
 * POST /api/sections/[id]/validate
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { collaborationService } from '@/services/collaboration-service'
import { ApiResponse } from '@/types/api'

export async function POST(
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

    const updated = await collaborationService.validateSection(sectionId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error validating section:', error)

    const statusCode =
      error instanceof Error && error.message.includes('Only REVIEWER')
        ? 403
        : error instanceof Error && error.message.includes('not found')
        ? 404
        : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to validate section',
        },
      },
      { status: statusCode }
    )
  }
}

