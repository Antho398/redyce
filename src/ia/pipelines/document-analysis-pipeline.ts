/**
 * Pipeline d'analyse générale de documents
 * (Amélioration du pipeline existant)
 */

import { iaClient } from '../client'
import {
  DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
  buildExtractionPrompt,
  buildSummaryPrompt,
  buildQAPrompt,
} from '../prompts/document-analysis'

export interface DocumentAnalysisPipelineOptions {
  documentContent: string
  documentType: string
  analysisType: 'extraction' | 'summary' | 'qa'
  questions?: string[]
  maxLength?: number
  model?: string
  temperature?: number
}

export interface DocumentAnalysisResult {
  content: string
  metadata?: {
    tokensUsed?: number
    model?: string
  }
}

/**
 * Pipeline d'analyse de document
 */
export async function analyzeDocumentPipeline(
  options: DocumentAnalysisPipelineOptions
): Promise<DocumentAnalysisResult> {
  try {
    let prompt: string

    switch (options.analysisType) {
      case 'extraction':
        prompt = buildExtractionPrompt(options.documentType, options.documentContent)
        break
      case 'summary':
        prompt = buildSummaryPrompt(options.documentContent, options.maxLength || 500)
        break
      case 'qa':
        if (!options.questions || options.questions.length === 0) {
          throw new Error('Questions are required for QA analysis')
        }
        prompt = buildQAPrompt(options.documentContent, options.questions)
        break
      default:
        throw new Error(`Unsupported analysis type: ${options.analysisType}`)
    }

    const response = await iaClient.generateResponse(
      {
        system: DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
        user: prompt,
      },
      {
        model: options.model || 'gpt-4-turbo-preview',
        temperature: options.temperature ?? 0.7,
        maxTokens: options.analysisType === 'summary' ? 1000 : 2000,
      }
    )

    return {
      content: response.content,
      metadata: {
        tokensUsed: response.metadata?.tokensUsed,
        model: options.model || 'gpt-4-turbo-preview',
      },
    }
  } catch (error) {
    console.error('Document analysis pipeline error:', error)
    throw new Error(
      `Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

