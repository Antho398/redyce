/**
 * Route API pour les documents d'un projet
 * GET /api/projects/[id]/documents - Liste des documents d'un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const documents = await documentService.getProjectDocuments(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: documents,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch documents',
        },
      },
      { status: 500 }
    )
  }
}

