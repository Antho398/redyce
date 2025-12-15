/**
 * Route API pour gérer les questions d'un template
 * GET /api/template-questions/[documentId] - Récupère les questions
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const userId = await requireAuth()
  const { documentId } = params

  try {
    const questions = await memoryTemplateService.getTemplateQuestions(documentId, userId)
    return NextResponse.json<ApiResponse>({ success: true, data: questions }, { status: 200 })
  } catch (error) {
    console.error('GET /api/template-questions error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Document') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

