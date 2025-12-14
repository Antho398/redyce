/**
 * Route API pour récupérer une section détaillée
 * GET /api/memoire/sections/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const sectionId = params.id

  try {
    const section = await memorySectionService.getSectionById(sectionId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: section,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch section',
        },
      },
      { status: 500 }
    )
  }
}

