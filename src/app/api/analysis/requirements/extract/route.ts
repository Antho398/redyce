/**
 * Route API pour extraire les exigences d'un document
 * POST /api/analysis/requirements/extract
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirementService } from '@/services/requirement-service'
import { extractRequirementsSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { documentId } = extractRequirementsSchema.parse(body)

  logOperationStart('Requirements Extract', {
    userId,
    documentId,
  })

  try {
    const requirements = await requirementService.extractRequirements(documentId, userId)

    logOperationSuccess('Requirements Extract', {
      userId,
      documentId,
      count: requirements.length,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: requirements,
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Requirements Extract', error as Error, {
      userId,
      documentId,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to extract requirements',
        },
      },
      { status: 500 }
    )
  }
}

