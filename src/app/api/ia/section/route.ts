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
import { getUserMessage } from '@/lib/utils/business-errors'

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

    // Générer la proposition (convertir actionType en action pour compatibilité temporaire)
    const result = await sectionAIService.generateSectionProposal(userId, {
      projectId: data.projectId,
      memoireId: data.memoireId,
      sectionId: data.sectionId,
      actionType: data.actionType,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log serveur (sans contenu sensible)
    console.error('[AI Section] Error:', {
      action: body.actionType,
      memoireId: body.memoireId,
      sectionId: body.sectionId,
      userId: session?.user?.id,
      errorType: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    // Message utilisateur clair (pas de stacktrace)
    const userMessage = getUserMessage(error)

    // Code d'erreur HTTP approprié
    let statusCode = 500
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        statusCode = 400
      } else if (error.message.includes('Unauthorized') || error.message.includes('access')) {
        statusCode = 403
      } else if (error.message.includes('not found')) {
        statusCode = 404
      } else if (
        error.message.includes('insufficient') ||
        error.message.includes('context') ||
        error.message.includes('IA_INSUFFICIENT_CONTEXT')
      ) {
        statusCode = 400
      } else if (error.message.includes('API key') || error.message.includes('quota')) {
        statusCode = 503
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: userMessage,
        },
      },
      { status: statusCode }
    )
  }
}

