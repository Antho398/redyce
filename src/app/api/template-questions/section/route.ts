/**
 * Route API pour créer une nouvelle section de template
 * POST /api/template-questions/section - Crée une section
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

const createSectionSchema = z.object({
  documentId: z.string().cuid(),
  title: z.string().min(1),
  order: z.number().int().positive(),
  required: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const userId = await requireAuth()

  try {
    const body = await request.json()
    const data = createSectionSchema.parse(body)

    const section = await memoryTemplateService.createTemplateSection(data.documentId, userId, {
      title: data.title,
      order: data.order,
      required: data.required,
    })

    return NextResponse.json<ApiResponse>({ success: true, data: section }, { status: 201 })
  } catch (error) {
    console.error('POST /api/template-questions/section error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Section') ? 404 :
      message.includes('access') ? 403 :
      message.includes('existe déjà') ? 409 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

