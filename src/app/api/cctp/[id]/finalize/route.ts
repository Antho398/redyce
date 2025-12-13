/**
 * Route API pour finaliser un CCTP
 * POST /api/cctp/[id]/finalize
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth()
  const cctpId = params.id

  logOperationStart('CCTP Finalize', {
    userId,
    cctpId,
  })

  try {
    const cctp = await cctpService.finalizeCCTP(cctpId, userId)

    logOperationSuccess('CCTP Finalize', {
      userId,
      cctpId,
      status: cctp.status,
      version: cctp.version,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cctp,
    })
  } catch (error) {
    logOperationError('CCTP Finalize', error as Error, {
      userId,
      cctpId,
    })
    
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

