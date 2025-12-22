/**
 * Route API pour supprimer un document méthodologie
 * DELETE /api/methodology-documents/[id] - Supprimer un document
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { methodologyDocumentService } from '@/services/methodology-document-service'
import { ApiResponse } from '@/types/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id } = params

    await methodologyDocumentService.deleteDocument(id, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error deleting methodology document:', error)

    const message = error instanceof Error ? error.message : 'Failed to delete document'
    const status =
      message.includes('not found') ? 404 :
      message.includes('access') ? 403 : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status }
    )
  }
}
