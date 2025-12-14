/**
 * Route API pour générer le contenu d'un mémoire technique
 * POST /api/memos/[id]/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { technicalMemoService } from '@/services/technical-memo-service'
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
    const memo = await technicalMemoService.generateMemo(params.id, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: memo,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating memo:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate memo',
        },
      },
      { status: 500 }
    )
  }
}

