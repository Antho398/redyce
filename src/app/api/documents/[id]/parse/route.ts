/**
 * Route API pour lancer le parsing d'un document
 * POST /api/documents/[id]/parse
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { ApiResponse, AnalysisResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'
import { autoExtractRequirements } from '@/services/auto-extract-requirements'
import { prisma } from '@/lib/prisma/client'

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

    // Déclencher l'extraction automatique des exigences si c'est un document AO traité
    // (en arrière-plan, ne bloque pas la réponse)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { documentType: true, projectId: true },
    })

    if (document && ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF'].includes(document.documentType)) {
      autoExtractRequirements(document.projectId, userId).catch((error) => {
        console.error('[Document Parse] Error in auto-extract requirements:', error)
        // Ne pas propager l'erreur, l'extraction est silencieuse
      })
    }

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

