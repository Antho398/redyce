/**
 * Route API pour la gestion des sections d'un mémoire
 * GET /api/memos/[id]/sections - Liste des sections
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
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

    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memo = await prisma.technicalMemo.findUnique({
      where: { id: memoireId },
    })

    if (!memo) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Memo not found',
          },
        },
        { status: 404 }
      )
    }

    if (memo.userId !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: You do not have access to this memo',
          },
        },
        { status: 403 }
      )
    }

    // Récupérer les sections
    const sections = await prisma.memoireSection.findMany({
      where: { memoireId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: sections,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching sections:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch sections',
        },
      },
      { status: 500 }
    )
  }
}

