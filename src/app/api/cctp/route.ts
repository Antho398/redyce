/**
 * Route API pour la gestion des CCTP
 * GET /api/cctp?projectId=xxx - Liste des CCTP d'un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

function getUserId(): string {
  return 'mock-user-id'
}

const querySchema = z.object({
  projectId: z.string().cuid(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId()
    const { searchParams } = new URL(request.url)
    const { projectId } = querySchema.parse({
      projectId: searchParams.get('projectId'),
    })

    const cctps = await cctpService.getProjectCCTPs(projectId, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cctps,
    })
  } catch (error) {
    console.error('Error fetching CCTPs:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to fetch CCTPs',
        },
      },
      { status: 500 }
    )
  }
}

