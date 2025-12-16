/**
 * Route API pour créer une nouvelle question de template
 * POST /api/template-questions/question - Crée une question
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

const createQuestionSchema = z.object({
  documentId: z.string().cuid(),
  sectionId: z.string().cuid().nullable().optional(),
  sectionOrder: z.number().int().positive().nullable().optional(),
  title: z.string().min(1),
  order: z.number().int().positive(),
  questionType: z.enum(['TEXT', 'YES_NO']).optional(),
  required: z.boolean().optional(),
  parentQuestionOrder: z.number().int().positive().nullable().optional(),
  isGroupHeader: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const userId = await requireAuth()

  try {
    const body = await request.json()
    const data = createQuestionSchema.parse(body)

    const question = await memoryTemplateService.createTemplateQuestion(data.documentId, userId, {
      sectionId: data.sectionId,
      sectionOrder: data.sectionOrder,
      title: data.title,
      order: data.order,
      questionType: data.questionType,
      required: data.required,
      parentQuestionOrder: data.parentQuestionOrder,
      isGroupHeader: data.isGroupHeader,
    })

    return NextResponse.json<ApiResponse>({ success: true, data: question }, { status: 201 })
  } catch (error) {
    console.error('POST /api/template-questions/question error', error)
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

