/**
 * Route API pour la gestion des versions de mémoires
 * POST /api/memos/[id]/versions - Crée une nouvelle version
 * GET /api/memos/[id]/versions - Récupère l'historique des versions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { memoireVersionService } from '@/services/memoire-version-service'
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
    const memoireId = params.id

    // Créer une nouvelle version
    const newVersion = await memoireVersionService.createNewVersion(memoireId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: newVersion,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating new version:', error)

    const statusCode =
      error instanceof Error && error.message.includes('frozen')
        ? 400
        : error instanceof Error && error.message.includes('access')
        ? 403
        : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create new version',
        },
      },
      { status: statusCode }
    )
  }
}

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

    // Récupérer l'historique des versions
    const history = await memoireVersionService.getVersionHistory(memoireId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: history,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching version history:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch version history',
        },
      },
      { status: 500 }
    )
  }
}

