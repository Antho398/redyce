/**
 * Route API pour parser un template mémoire
 * POST /api/memoire/template/parse
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseMemoryTemplateSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'
import { memoryTemplateService } from '@/services/memory-template-service'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId } = parseMemoryTemplateSchema.parse(body)

  logOperationStart('Memory Template Parse', {
    userId,
    projectId,
  })

  try {
    const template = await memoryTemplateService.parseTemplate(projectId, userId)

    logOperationSuccess('Memory Template Parse', {
      userId,
      projectId,
      status: template.status,
      sectionsCount: (template as any).sections?.length || 0,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: template,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Memory Template Parse', error as Error, {
      userId,
      projectId,
    })

    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('Template') || message.includes('Project') ? 404 :
      message.includes('access') ? 403 : 500

    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

