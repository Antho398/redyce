/**
 * Utilitaire pour gérer les erreurs API de manière cohérente
 * Évite les stacktraces côté UI, messages clairs pour l'utilisateur
 */

import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types/api'
import { getUserMessage } from './business-errors'

export interface ApiErrorContext {
  operation: string
  resourceId?: string
  userId?: string
  additionalData?: Record<string, unknown>
}

/**
 * Gère une erreur API et retourne une réponse NextResponse formatée
 */
export function handleApiError(
  error: unknown,
  context: ApiErrorContext
): NextResponse<ApiResponse> {
  // Log serveur (sans contenu sensible)
  console.error(`[${context.operation}] Error:`, {
    resourceId: context.resourceId,
    userId: context.userId,
    errorType: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : 'Unknown error',
    ...context.additionalData,
  })

  // Message utilisateur clair (pas de stacktrace)
  const userMessage = getUserMessage(error)

  // Déterminer le code d'erreur HTTP
  let statusCode = 500
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('unauthorized') || message.includes('access')) {
      statusCode = 403
    } else if (message.includes('not found')) {
      statusCode = 404
    } else if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('insufficient') ||
      message.includes('missing') ||
      message.includes('required')
    ) {
      statusCode = 400
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

