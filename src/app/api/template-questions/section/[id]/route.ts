/**
 * Route API pour supprimer une section de template
 * DELETE /api/template-questions/section/[id] - Supprime une section
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const { id: sectionId } = params

  try {
    await memoryTemplateService.deleteTemplateSection(sectionId, userId)
    return NextResponse.json<ApiResponse>({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/template-questions/section/[id] error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Section') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

