/**
 * Route API pour le chat avec l'IA
 * POST /api/ai/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/services/ai-service'
import { chatMessageSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'

function getUserId(): string {
  return 'mock-user-id'
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const body = await request.json()
    const { content, projectId } = chatMessageSchema.parse(body)

    const response = await aiService.chat(userId, content, projectId || undefined)

    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        success: true,
        data: { message: response },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in chat:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to process chat message',
        },
      },
      { status: 500 }
    )
  }
}

