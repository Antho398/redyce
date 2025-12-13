/**
 * Route API pour la consommation OpenAI
 * GET /api/usage - Récupère les statistiques
 * DELETE /api/usage - Supprime les données (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { UsageTracker } from '@/services/usage-tracker'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/getCurrentUser'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const filterUserId = searchParams.get('userId')

    // Si un userId est fourni dans les query params, vérifier que c'est l'utilisateur connecté ou admin
    // Pour l'instant, on permet uniquement de voir ses propres stats
    const stats = await UsageTracker.getUsageStats(filterUserId || userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch usage stats',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const filterUserId = searchParams.get('userId')

    // Pour l'instant, on permet uniquement de supprimer ses propres données
    // TODO: Ajouter un système d'admin pour permettre la suppression globale
    await UsageTracker.clearUsageData(filterUserId || userId)

    return NextResponse.json<ApiResponse>({
      success: true,
    })
  } catch (error) {
    console.error('Error clearing usage data:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to clear usage data',
        },
      },
      { status: 500 }
    )
  }
}

