/**
 * Route API pour recréer les sections d'un mémoire à partir du template
 * POST /api/memos/[id]/recreate-sections - Recréer les sections
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/project-access'
import { technicalMemoService } from '@/services/technical-memo-service'
import { ApiResponse } from '@/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: memoireId } = params

    await technicalMemoService.recreateSectionsFromTemplate(memoireId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Sections recréées avec succès',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/memos/[id]/recreate-sections error', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
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

