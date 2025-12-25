/**
 * API pour la méthodologie rédactionnelle d'un client
 * PUT /api/clients/[clientId]/methodology - Met à jour la méthodologie
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Non autorisé' } },
        { status: 401 }
      )
    }

    const { clientId } = params
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

    // Mettre à jour la méthodologie rédactionnelle
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        writingStyle: body.writingStyle,
        writingTone: body.writingTone,
        writingGuidelines: body.writingGuidelines,
        forbiddenWords: body.forbiddenWords,
        preferredTerms: body.preferredTerms,
        websiteUrl: body.websiteUrl,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        clientId: updatedClient.id,
        message: 'Méthodologie mise à jour',
      },
    })
  } catch (error) {
    console.error('Error updating client methodology:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
