/**
 * Route API pour un CCTP spécifique
 * GET /api/cctp/[id] - Récupérer un CCTP
 * PUT /api/cctp/[id] - Mettre à jour un CCTP
 * DELETE /api/cctp/[id] - Supprimer un CCTP
 */

import { NextRequest, NextResponse } from 'next/server'
import { cctpService } from '@/services/cctp-service'
import { updateCCTPSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    const cctp = await cctpService.getCCTPById(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cctp,
    })
  } catch (error) {
    console.error('Error fetching CCTP:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch CCTP',
        },
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    const body = await request.json()
    const data = updateCCTPSchema.parse(body)

    const cctp = await cctpService.updateCCTP(params.id, userId, data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cctp,
    })
  } catch (error) {
    console.error('Error updating CCTP:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update CCTP',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    await cctpService.deleteCCTP(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting CCTP:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete CCTP',
        },
      },
      { status: 500 }
    )
  }
}

