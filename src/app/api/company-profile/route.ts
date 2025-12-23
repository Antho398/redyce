/**
 * Route API pour la gestion du profil entreprise
 * GET /api/company-profile - Récupère le profil
 * POST /api/company-profile - Crée ou met à jour le profil (upsert)
 * PUT /api/company-profile - Alias de POST pour compatibilité
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { companyProfileService } from '@/services/company-profile-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const companyProfileSchema = z.object({
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  description: z.string().optional(),
  activities: z.string().optional(),
  workforce: z.string().optional(),
  equipment: z.string().optional(),
  qualitySafety: z.string().optional(),
  references: z.string().optional(),
  // Méthodologie de travail
  workMethodology: z.string().optional(),
  siteOccupied: z.string().optional(),
  // Méthodologie rédactionnelle
  writingStyle: z.string().optional(),
  writingTone: z.string().optional(),
  writingGuidelines: z.string().optional(),
  forbiddenWords: z.string().optional(),
  preferredTerms: z.string().optional(),
  websiteUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Récupérer le profil
    const profile = await companyProfileService.getProfile(userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: profile, // null si n'existe pas
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching company profile:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch company profile',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()

    // Valider les données
    const validatedData = companyProfileSchema.parse(body)

    // Créer ou mettre à jour le profil
    const profile = await companyProfileService.upsertProfile(userId, validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving company profile:', error)

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
          message: error instanceof Error ? error.message : 'Failed to save company profile',
        },
      },
      { status: 500 }
    )
  }
}

// PUT est un alias de POST pour compatibilité
export { POST as PUT }

