/**
 * Route API pour finaliser un CCTP
 * POST /api/cctp/[id]/finalize
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import { ApiResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    const cctp = await cctpService.finalizeCCTP(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cctp,
    })
  } catch (error) {
    console.error('Error finalizing CCTP:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to finalize CCTP',
        },
      },
      { status: 500 }
    )
  }
}

