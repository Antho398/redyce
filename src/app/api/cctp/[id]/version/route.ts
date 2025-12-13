/**
 * Route API pour créer une nouvelle version d'un CCTP
 * POST /api/cctp/[id]/version
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const newVersion = await cctpService.createNewVersion(params.id, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: newVersion,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating new CCTP version:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create new version',
        },
      },
      { status: 500 }
    )
  }
}

