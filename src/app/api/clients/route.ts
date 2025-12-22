/**
 * Route API pour la gestion des clients
 * GET /api/clients - Récupère tous les clients
 * POST /api/clients - Crée un nouveau client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { clientService } from '@/services/client-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis'),
  companyName: z.string().optional(),
  description: z.string().optional(),
  activities: z.string().optional(),
  workforce: z.string().optional(),
  equipment: z.string().optional(),
  qualitySafety: z.string().optional(),
  references: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()

    // Récupérer tous les clients
    const clients = await clientService.getClients(userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: clients,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error fetching clients:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch clients',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    // Valider les données
    const validatedData = createClientSchema.parse(body)

    // Créer le client
    const client = await clientService.createClient(userId, validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: client,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Error creating client:', error)

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
          message: error instanceof Error ? error.message : 'Failed to create client',
        },
      },
      { status: 500 }
    )
  }
}
