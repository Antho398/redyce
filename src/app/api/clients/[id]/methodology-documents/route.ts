/**
 * Route API pour récupérer les documents méthodologie d'un client
 * GET /api/clients/[id]/methodology-documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { methodologyDocumentService } from '@/services/methodology-document-service'
import { ApiResponse } from '@/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: clientId } = params

    const documents = await methodologyDocumentService.getClientDocuments(clientId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: documents,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error fetching client methodology documents:', error)

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
