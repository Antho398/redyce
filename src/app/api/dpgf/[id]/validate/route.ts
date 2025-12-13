/**
 * Route API pour valider un DPGF
 * POST /api/dpgf/[id]/validate
 */

import { NextRequest, NextResponse } from 'next/server'
import { dpgfService } from '@/services/dpgf-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const validation = await dpgfService.validateDPGF(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: validation,
    })
  } catch (error) {
    console.error('Error validating DPGF:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to validate DPGF',
        },
      },
      { status: 500 }
    )
  }
}

