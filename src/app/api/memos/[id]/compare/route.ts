/**
 * Route API pour comparer deux versions d'un mémoire
 * GET /api/memos/[id]/compare?versionId=
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { memoireVersionService } from '@/services/memoire-version-service'
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
    const memoireId1 = params.id
    const { searchParams } = new URL(request.url)
    const memoireId2 = searchParams.get('versionId')

    if (!memoireId2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'versionId query parameter is required',
          },
        },
        { status: 400 }
      )
    }

    // Comparer les deux versions
    const comparison = await memoireVersionService.compareVersions(
      memoireId1,
      memoireId2,
      userId
    )

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: comparison,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error comparing versions:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to compare versions',
        },
      },
      { status: 500 }
    )
  }
}

