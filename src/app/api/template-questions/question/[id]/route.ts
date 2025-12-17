/**
 * Route API pour gérer une question de template
 * PUT /api/template-questions/question/[id] - Met à jour une question
 * DELETE /api/template-questions/question/[id] - Supprime une question
 * 
 * RÈGLE V1 : Les questions sont IMMUABLES après extraction
 * - Les champs immuables : title, order, questionType, required, isGroupHeader
 * - Seules les modifications explicites par l'utilisateur sont autorisées (correction d'erreurs)
 * - INTERDIT : Modifications silencieuses automatiques
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

const updateQuestionSchema = z.object({
  title: z.string().min(1).optional(),
  path: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int().positive().optional(),
  parentQuestionOrder: z.number().int().positive().nullable().optional(),
  questionType: z.string().optional(),
  isGroupHeader: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const { id: questionId } = params

  try {
    const body = await request.json()
    const data = updateQuestionSchema.parse(body)

    const question = await memoryTemplateService.updateTemplateQuestion(questionId, userId, data)
    return NextResponse.json<ApiResponse>({ success: true, data: question }, { status: 200 })
  } catch (error) {
    console.error('PUT /api/template-questions/question error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Question') ? 404 :
      message.includes('access') ? 403 :
      message.includes('existe déjà') ? 409 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const { id: questionId } = params

  try {
    await memoryTemplateService.deleteTemplateQuestion(questionId, userId)
    return NextResponse.json<ApiResponse>({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/template-questions/question error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Question') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

