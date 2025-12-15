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
      { success: false, error: { message: 'projectId is required' } },
      { status: 400 }
    )
  }

  try {
    const template = await memoryTemplateService.getProjectTemplate(projectId, userId)
    return NextResponse.json<ApiResponse>({ success: true, data: template }, { status: 200 })
  } catch (error) {
    console.error('GET /api/memoire/template error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Project') ? 404 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId, documentId, name } = createMemoryTemplateSchema.parse(body)

  try {
    const template = await memoryTemplateService.createOrReplaceTemplate(projectId, documentId, userId, name)
    return NextResponse.json<ApiResponse>({ success: true, data: template }, { status: 201 })
  } catch (error) {
    console.error('POST /api/memoire/template error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('Project') || message.includes('Document') ? 404 :
      message.includes('access') ? 403 :
      message.includes('DOCX') || message.includes('PDF') ? 400 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuth()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const documentId = searchParams.get('documentId')

  if (!projectId || !documentId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'projectId and documentId are required' } },
      { status: 400 }
    )
  }

  try {
    const doc = await memoryTemplateService.removeTemplateDocument(projectId, documentId, userId)
    return NextResponse.json<ApiResponse>({ success: true, data: doc }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/memoire/template error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('Project') || message.includes('Document') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

