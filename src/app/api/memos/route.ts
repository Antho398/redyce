/**
 * Routes API pour la gestion des mémoires techniques
 * GET /api/memos - Liste des mémoires avec filtres
 * POST /api/memos - Créer un mémoire
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { technicalMemoService } from '@/services/technical-memo-service'
import {
  createTechnicalMemoSchema,
  getTechnicalMemosQuerySchema,
} from '@/lib/utils/validation'
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

    // Parser les paramètres de requête
    const query = getTechnicalMemosQuerySchema.parse({
      projectId: searchParams.get('projectId') || undefined,
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
    })

    const memos = await technicalMemoService.getUserMemos(userId, query)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: memos,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching memos:', error)
    
    // Log détaillé pour debug
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch memos',
        },
      },
      { status: 500 }
    )
  }
}

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
    const data = createTechnicalMemoSchema.parse(body)

    const memo = await technicalMemoService.createMemo(userId, data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: memo,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating memo:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create memo',
        },
      },
      { status: 500 }
    )
  }
}

