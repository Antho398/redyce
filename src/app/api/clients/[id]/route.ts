/**
 * Route API pour la gestion d'un client spécifique
 * GET /api/clients/[id] - Récupère un client
 * PUT /api/clients/[id] - Met à jour un client
 * DELETE /api/clients/[id] - Supprime un client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { clientService } from '@/services/client-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().optional(),
  description: z.string().optional(),
  activities: z.string().optional(),
  workforce: z.string().optional(),
  equipment: z.string().optional(),
  qualitySafety: z.string().optional(),
  references: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: clientId } = params

    const client = await clientService.getClient(clientId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: client,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error fetching client:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch client',
        },
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: clientId } = params
    const body = await request.json()

    // Valider les données
    const validatedData = updateClientSchema.parse(body)

    // Mettre à jour le client
    const client = await clientService.updateClient(clientId, userId, validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: client,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error updating client:', error)

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
          message: error instanceof Error ? error.message : 'Failed to update client',
        },
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: clientId } = params

    await clientService.deleteClient(clientId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error deleting client:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete client',
        },
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}
