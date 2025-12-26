/**
 * API Routes pour la gestion du tutoriel utilisateur
 * GET /api/user/tutorial - Récupérer l'état du tutoriel
 * PUT /api/user/tutorial - Mettre à jour l'état du tutoriel
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/project-access'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'
import { AppError } from '@/lib/utils/errors'

interface TutorialState {
  tutorialEnabled: boolean
  tutorialCompletedSteps: string[]
  tutorialStyle: string
  tutorialLastSeenAt: string | null
}

/**
 * GET /api/user/tutorial
 * Récupère l'état du tutoriel pour l'utilisateur connecté
 */
export async function GET(): Promise<NextResponse<ApiResponse<TutorialState>>> {
  try {
    const userId = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tutorialEnabled: true,
        tutorialCompletedSteps: true,
        tutorialStyle: true,
        tutorialLastSeenAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Utilisateur non trouvé' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        tutorialEnabled: user.tutorialEnabled,
        tutorialCompletedSteps: user.tutorialCompletedSteps,
        tutorialStyle: user.tutorialStyle,
        tutorialLastSeenAt: user.tutorialLastSeenAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('[Tutorial API] GET Error:', error)
    console.error('[Tutorial API] GET Error stack:', error instanceof Error ? error.stack : 'No stack')

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

interface UpdateTutorialRequest {
  tutorialEnabled?: boolean
  tutorialCompletedSteps?: string[]
  tutorialStyle?: string
}

/**
 * PUT /api/user/tutorial
 * Met à jour l'état du tutoriel pour l'utilisateur connecté
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TutorialState>>> {
  try {
    const userId = await requireAuth()

    const body: UpdateTutorialRequest = await request.json()

    // Valider les champs
    const updateData: any = {
      tutorialLastSeenAt: new Date(),
    }

    if (typeof body.tutorialEnabled === 'boolean') {
      updateData.tutorialEnabled = body.tutorialEnabled
    }

    if (Array.isArray(body.tutorialCompletedSteps)) {
      // Valider que c'est un tableau de strings
      if (body.tutorialCompletedSteps.every((s) => typeof s === 'string')) {
        updateData.tutorialCompletedSteps = body.tutorialCompletedSteps
      }
    }

    if (body.tutorialStyle && ['tooltip', 'spotlight'].includes(body.tutorialStyle)) {
      updateData.tutorialStyle = body.tutorialStyle
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        tutorialEnabled: true,
        tutorialCompletedSteps: true,
        tutorialStyle: true,
        tutorialLastSeenAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        tutorialEnabled: user.tutorialEnabled,
        tutorialCompletedSteps: user.tutorialCompletedSteps,
        tutorialStyle: user.tutorialStyle,
        tutorialLastSeenAt: user.tutorialLastSeenAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('[Tutorial API] PUT Error:', error)
    console.error('[Tutorial API] PUT Error stack:', error instanceof Error ? error.stack : 'No stack')

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' } },
      { status: 500 }
    )
  }
}
