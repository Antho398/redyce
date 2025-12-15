/**
 * Route API pour lister les exports d'un projet
 * GET /api/exports?projectId=
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { memoireExportService } from '@/services/memoire-export-service'
import { ApiResponse } from '@/types/api'

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'projectId is required',
          },
        },
        { status: 400 }
      )
    }

    // Récupérer les exports du projet
    const exports = await memoireExportService.getProjectExports(projectId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: exports,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching exports:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch exports',
        },
      },
      { status: 500 }
    )
  }
}

