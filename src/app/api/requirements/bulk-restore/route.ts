/**
 * Route API pour restaurer plusieurs exigences supprimées (remettre à A_TRAITER)
 * POST /api/requirements/bulk-restore
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const bulkRestoreSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(200),
})

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
    const { ids } = bulkRestoreSchema.parse(body)

    // Vérifier que toutes les exigences appartiennent à l'utilisateur
    const requirements = await prisma.requirement.findMany({
      where: {
        id: { in: ids },
        status: 'SUPPRIMEE', // Seules les exigences supprimées peuvent être restaurées
      },
      include: {
        project: true,
      },
    })

    // Vérifier que toutes les exigences existent et appartiennent à l'utilisateur
    const invalidIds = ids.filter(
      (id) => !requirements.some((r) => r.id === id && r.project.userId === userId)
    )

    if (invalidIds.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: `Some requirements do not exist, are not deleted, or you do not have access: ${invalidIds.join(', ')}`,
          },
        },
        { status: 403 }
      )
    }

    // Restaurer (remettre à A_TRAITER)
    const result = await prisma.requirement.updateMany({
      where: {
        id: { in: ids },
        project: {
          userId,
        },
        status: 'SUPPRIMEE',
      },
      data: {
        status: 'A_TRAITER',
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          restored: result.count,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error bulk restoring requirements:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to bulk restore requirements',
        },
      },
      { status: 500 }
    )
  }
}

