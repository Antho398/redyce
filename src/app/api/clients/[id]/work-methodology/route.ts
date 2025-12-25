/**
 * API pour la méthodologie de travail d'un client
 * PUT /api/clients/[id]/work-methodology - Met à jour la méthodologie de travail
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Non autorisé' } },
        { status: 401 }
      )
    }

    const clientId = params.id
    const body = await request.json()

    // Vérifier que le client appartient à l'utilisateur
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    })

    if (!existingClient) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Client non trouvé' } },
        { status: 404 }
      )
    }

    // Mettre à jour la méthodologie de travail
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        workMethodology: body.workMethodology,
        siteOccupied: body.siteOccupied,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        clientId: updatedClient.id,
        message: 'Méthodologie de travail mise à jour',
      },
    })
  } catch (error) {
    console.error('Error updating client work methodology:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
