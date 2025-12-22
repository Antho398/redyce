/**
 * Route API pour la gestion de la méthodologie d'un client
 * PUT /api/clients/[id]/methodology - Met à jour la méthodologie
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { clientService } from '@/services/client-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const methodologySchema = z.object({
  writingStyle: z.string().optional(),
  writingTone: z.string().optional(),
  writingGuidelines: z.string().optional(),
  forbiddenWords: z.string().optional(),
  preferredTerms: z.string().optional(),
  websiteUrl: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: clientId } = params
    const body = await request.json()

    // Valider les données
    const validatedData = methodologySchema.parse(body)

    // Mettre à jour la méthodologie
    const client = await clientService.updateClientMethodology(
      clientId,
      userId,
      validatedData
    )

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: client,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error updating client methodology:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update methodology',
        },
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}
