/**
 * Route API pour l'extraction DPGF depuis un document
 * POST /api/dpgf/extract
 */

import { NextRequest, NextResponse } from 'next/server'
import { dpgfService } from '@/services/dpgf-service'
import { extractDPGFSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id' // TODO: Remplacer par authentification réelle
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const body = await request.json()
    const { documentId, model, temperature } = extractDPGFSchema.parse(body)

    const dpgf = await dpgfService.extractDPGFFromDocument(
      documentId,
      userId,
      {
        model,
        temperature,
      }
    )

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: dpgf,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error extracting DPGF:', error)
    
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

