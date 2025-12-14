/**
 * Route API pour l'assistant IA de section
 * POST /api/ia/section - Génère une proposition pour une section
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { sectionAIService } from '@/services/section-ai-service'
import { sectionAIActionSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { env } from '@/config/env'

// Rate limiting simple (en mémoire, pour production utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requêtes par minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Vérifier la clé API OpenAI
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'AI service not configured: OPENAI_API_KEY is missing',
          },
        },
        { status: 503 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Rate limit exceeded. Please try again in a minute.',
          },
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const data = sectionAIActionSchema.parse(body)

    // Générer la proposition
    const result = await sectionAIService.generateSectionProposal(userId, data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating section proposal:', error)

    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      // Erreur de validation Zod
      if (error.name === 'ZodError') {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: 'Validation error',
              details: error,
            },
          },
          { status: 400 }
        )
      }

      // Erreur OpenAI (quota, clé invalide, etc.)
      if (error.message.includes('API key') || error.message.includes('quota')) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: 'AI service error: ' + error.message,
            },
          },
          { status: 503 }
        )
      }

      // Erreur de permissions
      if (error.message.includes('access') || error.message.includes('not found')) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: error.message,
            },
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate section proposal',
        },
      },
      { status: 500 }
    )
  }
}

