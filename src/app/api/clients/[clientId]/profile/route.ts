/**
 * API pour le profil entreprise d'un client
 * GET /api/clients/[clientId]/profile - Récupère le profil du client
 * PUT /api/clients/[clientId]/profile - Met à jour le profil du client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'

interface ClientProfileData {
  companyName?: string | null
  description?: string | null
  activities?: string | null
  workforce?: string | null
  equipment?: string | null
  qualitySafety?: string | null
  references?: string | null
  workMethodology?: string | null
  siteOccupied?: string | null
  writingStyle?: string | null
  writingTone?: string | null
  writingGuidelines?: string | null
  forbiddenWords?: string | null
  preferredTerms?: string | null
  websiteUrl?: string | null
}

export async function GET(
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

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Client non trouvé' } },
        { status: 404 }
      )
    }

    // Retourner le profil du client
    const profile: ClientProfileData = {
      companyName: client.companyName,
      description: client.description,
      activities: client.activities,
      workforce: client.workforce,
      equipment: client.equipment,
      qualitySafety: client.qualitySafety,
      references: client.references,
      workMethodology: client.workMethodology,
      siteOccupied: client.siteOccupied,
      writingStyle: client.writingStyle,
      writingTone: client.writingTone,
      writingGuidelines: client.writingGuidelines,
      forbiddenWords: client.forbiddenWords,
      preferredTerms: client.preferredTerms,
      websiteUrl: client.websiteUrl,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        clientId: client.id,
        clientName: client.name,
        profile,
      },
    })
  } catch (error) {
    console.error('Error fetching client profile:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

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

    // Mettre à jour le profil du client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        companyName: body.companyName,
        description: body.description,
        activities: body.activities,
        workforce: body.workforce,
        equipment: body.equipment,
        qualitySafety: body.qualitySafety,
        references: body.references,
        workMethodology: body.workMethodology,
        siteOccupied: body.siteOccupied,
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
        clientName: updatedClient.name,
        message: 'Profil mis à jour',
      },
    })
  } catch (error) {
    console.error('Error updating client profile:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
