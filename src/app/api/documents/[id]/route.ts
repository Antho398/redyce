/**
 * Route API pour un document spécifique
 * GET /api/documents/[id] - Récupérer un document
 * PUT /api/documents/[id] - Mettre à jour un document
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    
    const { documentType, name } = body
    
    if (!documentType && !name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'documentType or name is required',
          },
        },
        { status: 400 }
      )
    }

    // Valider documentType si fourni
    if (documentType) {
      const validTypes = ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'MODELE_MEMOIRE', 'AUTRE']
      if (!validTypes.includes(documentType)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Invalid documentType. Must be one of: ${validTypes.join(', ')}`,
            },
          },
          { status: 400 }
        )
      }
    }

    const updated = await documentService.updateDocument(params.id, userId, {
      documentType,
      name,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating document:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to update document',
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

