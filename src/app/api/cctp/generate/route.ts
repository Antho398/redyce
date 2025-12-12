/**
 * Route API pour la génération de CCTP
 * POST /api/cctp/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import {
  generateCCTPFromDPGFSchema,
  generateCCTPFromDocumentsSchema,
} from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id'
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const body = await request.json()

    // Vérifier si c'est une génération depuis DPGF ou depuis documents
    let cctp

    if (body.dpgfId) {
      // Génération depuis DPGF
      const { dpgfId, userRequirements, additionalContext, model, temperature } =
        generateCCTPFromDPGFSchema.parse(body)

      cctp = await cctpService.generateCCTPFromDPGF(
        dpgfId,
        userId,
        {
          userRequirements,
          additionalContext,
          model,
          temperature,
        }
      )
    } else if (body.projectId) {
      // Génération depuis documents
      const {
        projectId,
        userRequirements,
        additionalContext,
        model,
        temperature,
      } = generateCCTPFromDocumentsSchema.parse(body)

      cctp = await cctpService.generateCCTPFromDocuments(
        projectId,
        userId,
        {
          userRequirements,
          additionalContext,
          model,
          temperature,
        }
      )
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Either dpgfId or projectId is required',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: cctp,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating CCTP:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to generate CCTP',
        },
      },
      { status: 500 }
    )
  }
}

