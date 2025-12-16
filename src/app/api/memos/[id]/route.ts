/**
 * Route API pour un mémoire technique spécifique
 * DELETE /api/memos/[id] - Supprimer un mémoire
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/project-access'
import { technicalMemoService } from '@/services/technical-memo-service'
import { ApiResponse } from '@/types/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: memoId } = params

    await technicalMemoService.deleteMemo(memoId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/memos/[id] error', error)

    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('not found') || message.includes('NotFound') ? 404 :
      message.includes('access') || message.includes('Unauthorized') ? 403 : 500

    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}
