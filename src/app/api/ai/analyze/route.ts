/**
 * Route API pour l'analyse IA de documents
 * POST /api/ai/analyze
 */

import { requireAuth } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { analysisService } from '@/services/analysis-service'
import { ANALYSIS_TYPES } from '@/config/constants'
import { ApiResponse, AnalysisResponse } from '@/types/api'
import { z } from 'zod'

const analyzeSchema = z.object({
  documentId: z.string().cuid(),
  analysisType: z.enum(['extraction', 'summary', 'qa', 'full']).optional().default('full'),
  questions: z.array(z.string()).optional(),
})


export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { documentId, analysisType, questions } = analyzeSchema.parse(body)

    let result: any

    if (questions && questions.length > 0) {
      // Analyse Q&A
      const answer = await analysisService.answerQuestions(documentId, userId, questions)
      result = { answers: answer }
    } else {
      // Analyse standard
      const analysis = await analysisService.analyzeDocument(documentId, userId, analysisType)
      result = {
        analysisId: analysis.id,
        status: analysis.status,
        result: analysis.result,
      }
    }

    return NextResponse.json<ApiResponse<AnalysisResponse>>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error analyzing document:', error)
    
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
          message: error instanceof Error ? error.message : 'Failed to analyze document',
        },
      },
      { status: 500 }
    )
  }
}

