/**
 * Service métier pour l'analyse de documents avec IA
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { buildExtractionPrompt, buildSummaryPrompt, buildQAPrompt } from '@/lib/ai/prompts/document-analysis'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { documentService } from './document-service'
import { ANALYSIS_STATUS, ANALYSIS_TYPES } from '@/config/constants'

export class AnalysisService {
  /**
   * Lance une analyse complète d'un document
   */
  async analyzeDocument(
    documentId: string,
    userId: string,
    analysisType: string = ANALYSIS_TYPES.FULL
  ) {
    const document = await documentService.getDocumentById(documentId, userId)

    if (document.status !== 'processed') {
      throw new Error('Document must be processed before analysis')
    }

    // Créer l'enregistrement d'analyse
    const analysis = await prisma.documentAnalysis.create({
      data: {
        documentId,
        analysisType,
        status: ANALYSIS_STATUS.PROCESSING,
      },
    })

    try {
      // Récupérer le contenu extrait
      const lastExtraction = document.analyses.find((a) => a.analysisType === 'extraction')
      if (!lastExtraction || !lastExtraction.result) {
        throw new Error('No extraction found for this document')
      }

      const extractedContent = (lastExtraction.result as any).extractedContent?.text || ''
      const documentType = (lastExtraction.result as any).documentType || 'OTHER'

      let result: any = {}

      // Analyse selon le type demandé
      if (analysisType === ANALYSIS_TYPES.EXTRACTION || analysisType === ANALYSIS_TYPES.FULL) {
        const extractionPrompt = buildExtractionPrompt(documentType, extractedContent)
        const extractionResponse = await aiClient.generateResponse({
          system: 'You are an expert in analyzing technical documents.',
          user: extractionPrompt,
        })
        result.extraction = extractionResponse.content
      }

      if (analysisType === ANALYSIS_TYPES.SUMMARY || analysisType === ANALYSIS_TYPES.FULL) {
        const summaryPrompt = buildSummaryPrompt(extractedContent)
        const summaryResponse = await aiClient.generateResponse({
          user: summaryPrompt,
        })
        result.summary = summaryResponse.content
      }

      // Mettre à jour l'analyse
      const updatedAnalysis = await prisma.documentAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: ANALYSIS_STATUS.COMPLETED,
          result,
        },
      })

      return updatedAnalysis
    } catch (error) {
      await prisma.documentAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: ANALYSIS_STATUS.ERROR,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }

  /**
   * Répond à des questions sur un document
   */
  async answerQuestions(documentId: string, userId: string, questions: string[]) {
    const document = await documentService.getDocumentById(documentId, userId)

    const lastExtraction = document.analyses.find((a) => a.analysisType === 'extraction')
    if (!lastExtraction || !lastExtraction.result) {
      throw new Error('No extraction found for this document')
    }

    const extractedContent = (lastExtraction.result as any).extractedContent?.text || ''

    const qaPrompt = buildQAPrompt(extractedContent, questions)
    const response = await aiClient.generateResponse({
      system: 'You are an expert in technical documents. Answer questions precisely based on the provided document.',
      user: qaPrompt,
    })

    return response.content
  }
}

export const analysisService = new AnalysisService()

