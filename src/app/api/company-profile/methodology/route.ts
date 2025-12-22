/**
 * Route API pour la méthodologie rédactionnelle
 * PUT /api/company-profile/methodology - Mettre à jour la méthodologie
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { companyProfileService } from '@/services/company-profile-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const methodologySchema = z.object({
  writingStyle: z.string().optional(),
  writingTone: z.string().optional(),
  writingGuidelines: z.string().optional(),
  forbiddenWords: z.string().optional(),
  preferredTerms: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    // Validation
    const validation = methodologySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    // Mettre à jour la méthodologie
    const profile = await companyProfileService.updateMethodology(userId, validation.data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error updating methodology:', error)

    const message = error instanceof Error ? error.message : 'Failed to update methodology'
    const status = message.includes('not found') ? 404 : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status }
    )
  }
}
