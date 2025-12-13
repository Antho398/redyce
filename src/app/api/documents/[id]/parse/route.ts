/**
 * Route API pour lancer le parsing d'un document
 * POST /api/documents/[id]/parse
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse, AnalysisResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const documentId = params.id

  logOperationStart('Document Parse', {
    userId,
    documentId,
  })

  try {
    // Lancer le traitement de manière asynchrone (pour production, utiliser une queue)
    const analysis = await documentService.processDocument(documentId, userId)

    const response: AnalysisResponse = {
      analysisId: analysis.id,
      status: analysis.status,
      result: analysis.result || undefined,
    }

    logOperationSuccess('Document Parse', {
      userId,
      documentId,
      analysisId: analysis.id,
      status: analysis.status,
    })

    return NextResponse.json<ApiResponse<AnalysisResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Document Parse', error as Error, {
      userId,
      documentId,
    })
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to parse document',
        },
      },
      { status: 500 }
    )
  }
}

