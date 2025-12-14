/**
 * Route API pour gérer le template mémoire
 * GET /api/memoire/template?projectId=xxx - Récupère le template d'un projet
 * POST /api/memoire/template - Crée un template depuis un document
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryTemplateService } from '@/services/memory-template-service'
import { createMemoryTemplateSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const userId = await requireAuth()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: 'projectId is required',
        },
      },
      { status: 400 }
    )
  }

  try {
    const template = await memoryTemplateService.getProjectTemplate(projectId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: template,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch template',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId, documentId, name } = createMemoryTemplateSchema.parse(body)

  try {
    // createOrReplace: remplace si existe déjà
    const template = await memoryTemplateService.createOrReplaceTemplate(
      projectId,
      documentId,
      userId,
      name
    )

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create template',
        },
      },
      { status: 500 }
    )
  }
}

