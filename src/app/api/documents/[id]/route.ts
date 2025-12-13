/**
 * Route API pour un document spécifique
 * GET /api/documents/[id] - Récupérer un document
 * DELETE /api/documents/[id] - Supprimer un document
 */

import { requireAuth } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse } from '@/types/api'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const document = await documentService.getDocumentById(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch document',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    await documentService.deleteDocument(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete document',
        },
      },
      { status: 500 }
    )
  }
}

