/**
 * Route API pour vérifier la fraîcheur des sections d'un mémoire
 * GET /api/memos/[id]/staleness - Retourne le statut de fraîcheur de toutes les sections
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { sectionStalenessService } from '@/services/section-staleness-service'
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
    const memoireId = params.id

    const result = await sectionStalenessService.checkMemoireStaleness(userId, memoireId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking staleness:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to check staleness',
        },
      },
      { status: 500 }
    )
  }
}
