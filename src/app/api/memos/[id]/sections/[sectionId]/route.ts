/**
 * Route API pour la gestion d'une section spécifique
 * PUT /api/memos/[id]/sections/[sectionId] - Mettre à jour une section
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { updateMemoireSectionSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
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
    const sectionId = params.sectionId
    const body = await request.json()

    const updateData = updateMemoireSectionSchema.parse(body)

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

    // Vérifier que la section existe et appartient au mémoire
    const section = await prisma.memoireSection.findUnique({
      where: { id: sectionId },
    })

    if (!section) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Section not found',
          },
        },
        { status: 404 }
      )
    }

    if (section.memoireId !== memoireId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Section does not belong to this memo',
          },
        },
        { status: 400 }
      )
    }

    // Mettre à jour la section
    const updated = await prisma.memoireSection.update({
      where: { id: sectionId },
      data: updateData,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating section:', error)

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
          message: error instanceof Error ? error.message : 'Failed to update section',
        },
      },
      { status: 500 }
    )
  }
}

