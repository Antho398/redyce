/**
 * Route API pour la génération de mémoires
 * POST /api/ai/memory - Générer un mémoire
 */

import { requireAuth } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { memoryService } from '@/services/memory-service'
import { createMemorySchema } from '@/lib/utils/validation'
import { ApiResponse, MemoryGenerationResponse } from '@/types/api'
import { z } from 'zod'

const generateMemorySchema = z.object({
  memoryId: z.string().cuid(),
  userRequirements: z.string().optional(),
})


export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { memoryId, userRequirements } = generateMemorySchema.parse(body)

    const memory = await memoryService.generateMemory(memoryId, userId, userRequirements)

    const response: MemoryGenerationResponse = {
      memoryId: memory.id,
      status: memory.status,
      content: memory.content,
    }

    return NextResponse.json<ApiResponse<MemoryGenerationResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating memory:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to generate memory',
        },
      },
      { status: 500 }
    )
  }
}

