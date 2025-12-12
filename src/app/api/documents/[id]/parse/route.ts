/**
 * Route API pour lancer le parsing d'un document
 * POST /api/documents/[id]/parse
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse, AnalysisResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    
    // Lancer le traitement de manière asynchrone (pour production, utiliser une queue)
    const analysis = await documentService.processDocument(params.id, userId)

    const response: AnalysisResponse = {
      analysisId: analysis.id,
      status: analysis.status,
      result: analysis.result || undefined,
    }

    return NextResponse.json<ApiResponse<AnalysisResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error parsing document:', error)
    
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

