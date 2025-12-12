/**
 * Route API pour la gestion des DPGF
 * GET /api/dpgf?projectId=xxx - Liste des DPGF d'un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { dpgfService } from '@/services/dpgf-service'
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

    const dpgfs = await dpgfService.getProjectDPGFs(projectId, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: dpgfs,
    })
  } catch (error) {
    console.error('Error fetching DPGFs:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to fetch DPGFs',
        },
      },
      { status: 500 }
    )
  }
}

