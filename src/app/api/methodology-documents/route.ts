/**
 * Route API pour lister les documents méthodologie
 * GET /api/methodology-documents - Récupérer tous les documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { methodologyDocumentService } from '@/services/methodology-document-service'
import { ApiResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()

    const documents = await methodologyDocumentService.getUserDocuments(userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: documents,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error fetching methodology documents:', error)

    const message = error instanceof Error ? error.message : 'Failed to fetch documents'

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status: 500 }
    )
  }
}
