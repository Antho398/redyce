/**
 * Route API pour la génération IA par lot (batch) avec planification par item
 * POST /api/ia/section-batch - Génère plusieurs sections d'un même item en 2 phases
 *
 * Phase 1 : Planification - L'IA analyse toutes les questions de l'item et crée un plan de répartition
 * Phase 2 : Génération - Génère chaque réponse en suivant le plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { sectionBatchAIService } from '@/services/section-batch-ai-service'
import { ApiResponse } from '@/types/api'
import { env } from '@/config/env'
import { getUserMessage } from '@/lib/utils/business-errors'
import { z } from 'zod'

// Schema de validation
const sectionBatchSchema = z.object({
  projectId: z.string(),
  memoireId: z.string(),
  sectionIds: z.array(z.string()).min(1),
  itemId: z.string().optional(),
  itemTitle: z.string().optional(),
  responseLength: z.enum(['short', 'standard', 'detailed']).default('standard'),
})

// Rate limiting simple
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requêtes batch par minute

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
  let session: any = null
  let body: any = null

  try {
    session = await getServerSession(authOptions)

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

    body = await request.json()
    const data = sectionBatchSchema.parse(body)

    // Générer les réponses en 2 phases
    const result = await sectionBatchAIService.generateBatchWithPlanning(userId, {
      projectId: data.projectId,
      memoireId: data.memoireId,
      sectionIds: data.sectionIds,
      itemId: data.itemId,
      itemTitle: data.itemTitle,
      responseLength: data.responseLength,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log serveur
    console.error('[AI Section Batch] Error:', {
      memoireId: body?.memoireId,
      sectionIds: body?.sectionIds,
      userId: session?.user?.id,
      errorType: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    // Message utilisateur clair
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
