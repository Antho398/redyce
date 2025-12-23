/**
 * Route API pour la méthodologie de travail (phases chantier)
 * PUT /api/company-profile/work-methodology - Mettre à jour la méthodologie de travail
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { companyProfileService } from '@/services/company-profile-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const workMethodologySchema = z.object({
  workMethodology: z.string().optional(),
  siteOccupied: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    // Validation
    const validation = workMethodologySchema.safeParse(body)

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

    // Mettre à jour la méthodologie de travail
    const profile = await companyProfileService.updateWorkMethodology(userId, validation.data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error updating work methodology:', error)

    const message = error instanceof Error ? error.message : 'Failed to update work methodology'
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
