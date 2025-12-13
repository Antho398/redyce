/**
 * Route API pour la gestion des documents
 * GET /api/documents - Liste des documents de l'utilisateur connecté
 * POST /api/documents - Créer un document (utilise plutôt /api/documents/upload)
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

/**
 * GET /api/documents
 * Récupère tous les documents de l'utilisateur connecté (tous projets confondus)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const documents = await documentService.getUserDocuments(userId)

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

/**
 * POST /api/documents
 * Note: Cette route n'est généralement pas utilisée.
 * Utilisez plutôt /api/documents/upload pour uploader un fichier.
 */
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: 'Use /api/documents/upload to upload a document file',
        },
      },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create document',
        },
      },
      { status: 500 }
    )
  }
}

