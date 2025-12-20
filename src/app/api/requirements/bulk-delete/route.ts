/**
 * Route API pour supprimer (soft delete) plusieurs exigences en lot
 * POST /api/requirements/bulk-delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(200),
  permanent: z.boolean().default(false), // Si true, suppression définitive
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
    const { ids, permanent } = bulkDeleteSchema.parse(body)

    // Vérifier que toutes les exigences appartiennent à l'utilisateur
    const requirements = await prisma.requirement.findMany({
      where: {
        id: { in: ids },
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
            message: `Some requirements do not exist or you do not have access: ${invalidIds.join(', ')}`,
          },
        },
        { status: 403 }
      )
    }

    if (permanent) {
      // Suppression définitive
      const result = await prisma.requirement.deleteMany({
        where: {
          id: { in: ids },
          project: {
            userId,
          },
        },
      })

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            deleted: result.count,
          },
        },
        { status: 200 }
      )
    } else {
      // Soft delete (status = SUPPRIMEE)
      const result = await prisma.requirement.updateMany({
        where: {
          id: { in: ids },
          project: {
            userId,
          },
        },
        data: {
          status: 'SUPPRIMEE',
        },
      })

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            deleted: result.count,
          },
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error bulk deleting requirements:', error)

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
          message: error instanceof Error ? error.message : 'Failed to bulk delete requirements',
        },
      },
      { status: 500 }
    )
  }
}

