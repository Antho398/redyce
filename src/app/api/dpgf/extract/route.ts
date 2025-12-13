/**
 * Route API pour l'extraction DPGF depuis un document
 * POST /api/dpgf/extract
 */

import { NextRequest, NextResponse } from 'next/server'
import { dpgfService } from '@/services/dpgf-service'
import { extractDPGFSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()
  
  const { documentId, model, temperature } = extractDPGFSchema.parse(body)

  logOperationStart('DPGF Extract', {
    userId,
    documentId,
    model,
    temperature,
  })

  try {
    const dpgf = await dpgfService.extractDPGFFromDocument(
      documentId,
      userId,
      {
        model,
        temperature,
      }
    )

    logOperationSuccess('DPGF Extract', {
      userId,
      documentId,
      dpgfId: dpgf.id,
      title: dpgf.title,
      confidence: dpgf.confidence,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: dpgf,
      },
      { status: 201 }
    )
  } catch (error) {
    logOperationError('DPGF Extract', error as Error, {
      userId,
      documentId,
    })
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to extract DPGF',
        },
      },
      { status: 500 }
    )
  }
}

