/**
 * Route API pour un DPGF spécifique
 * GET /api/dpgf/[id] - Récupérer un DPGF
 * PUT /api/dpgf/[id] - Mettre à jour un DPGF
 * DELETE /api/dpgf/[id] - Supprimer un DPGF
 */

import { NextRequest, NextResponse } from 'next/server'
import { dpgfService } from '@/services/dpgf-service'
import { updateDPGFSchema } from '@/lib/utils/validation'
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
    const dpgf = await dpgfService.getDPGFById(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: dpgf,
    })
  } catch (error) {
    console.error('Error fetching DPGF:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to fetch DPGF',
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
    const data = updateDPGFSchema.parse(body)

    const dpgf = await dpgfService.updateDPGF(params.id, userId, data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: dpgf,
    })
  } catch (error) {
    console.error('Error updating DPGF:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to update DPGF',
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
    await dpgfService.deleteDPGF(params.id, userId)

    return NextResponse.json<ApiResponse>({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting DPGF:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to delete DPGF',
        },
      },
      { status: 500 }
    )
  }
}

