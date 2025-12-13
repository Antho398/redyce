/**
 * Pipeline d'extraction structurée de DPGF
 * Extrait et structure automatiquement les données d'un document DPGF
 */

import { iaClient } from '../client'
import { DPGF_EXTRACTION_SYSTEM_PROMPT, buildDPGFExtractionPrompt } from '../prompts/dpgf-extraction'

export interface DPGFExtractedData {
  titre: string
  reference?: string | null
  dateCreation?: string | null
  articles: Array<{
    numero: string
    titre?: string
    prescriptions: string[]
    materiaux?: Array<{
      designation: string
      caracteristiques: Record<string, any>
    }>
  }>
  materiauxGeneraux?: Array<{
    designation: string
    caracteristiques: Record<string, any>
    notes?: string
  }>
  normes?: string[]
  observations?: string
}

export interface DPGFExtractionPipelineOptions {
  documentContent: string
  documentType?: string
  model?: string
  temperature?: number
  tracking?: {
    userId: string
    userEmail?: string
    operation: string
    projectId?: string
    documentId?: string
  }
}

export interface DPGFExtractionResult {
  data: DPGFExtractedData
  confidence: number
  rawResponse?: string
  metadata?: {
    tokensUsed?: number
    model?: string
  }
}

/**
 * Pipeline principal d'extraction DPGF
 */
export async function extractDPGFPipeline(
  options: DPGFExtractionPipelineOptions
): Promise<DPGFExtractionResult> {
  try {
    // 1. Construire le prompt d'extraction
    const prompt = buildDPGFExtractionPrompt({
      documentContent: options.documentContent,
      documentType: options.documentType,
    })

    // 2. Générer la réponse JSON structurée
    const response = await iaClient.generateJSONResponse<DPGFExtractedData>(
      {
        system: DPGF_EXTRACTION_SYSTEM_PROMPT,
        user: prompt,
      },
      {
        model: options.model || 'gpt-4-turbo-preview',
        temperature: options.temperature ?? 0.3, // Basse température pour extraction précise
        maxTokens: 4000,
        tracking: options.tracking,
      }
    )

    // 3. Valider et normaliser les données
    const normalizedData = normalizeDPGFData(response)

    // 4. Calculer un score de confiance basique
    // (Dans une version avancée, on pourrait utiliser des heuristiques plus sophistiquées)
    const confidence = calculateConfidence(normalizedData)

    return {
      data: normalizedData,
      confidence,
      metadata: {
        model: options.model || 'gpt-4-turbo-preview',
      },
    }
  } catch (error) {
    console.error('DPGF extraction pipeline error:', error)
    throw new Error(
      `Failed to extract DPGF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Normalise les données extraites pour s'assurer qu'elles respectent le schéma
 */
function normalizeDPGFData(data: any): DPGFExtractedData {
  return {
    titre: data.titre || 'DPGF sans titre',
    reference: data.reference || null,
    dateCreation: data.dateCreation || null,
    articles: Array.isArray(data.articles)
      ? data.articles.map((article: any) => ({
          numero: article.numero || '',
          titre: article.titre,
          prescriptions: Array.isArray(article.prescriptions)
            ? article.prescriptions
            : [],
          materiaux: Array.isArray(article.materiaux)
            ? article.materiaux.map((m: any) => ({
                designation: m.designation || '',
                caracteristiques: m.caracteristiques || {},
              }))
            : [],
        }))
      : [],
    materiauxGeneraux: Array.isArray(data.materiauxGeneraux)
      ? data.materiauxGeneraux.map((m: any) => ({
          designation: m.designation || '',
          caracteristiques: m.caracteristiques || {},
          notes: m.notes,
        }))
      : [],
    normes: Array.isArray(data.normes) ? data.normes : [],
    observations: data.observations || '',
  }
}

/**
 * Calcule un score de confiance basique
 */
function calculateConfidence(data: DPGFExtractedData): number {
  let score = 0.5 // Score de base

  // Bonus si on a des articles
  if (data.articles.length > 0) {
    score += 0.2
  }

  // Bonus si on a des matériaux
  if (data.materiauxGeneraux && data.materiauxGeneraux.length > 0) {
    score += 0.1
  }

  // Bonus si on a des normes
  if (data.normes && data.normes.length > 0) {
    score += 0.1
  }

  // Bonus si on a une référence
  if (data.reference) {
    score += 0.1
  }

  return Math.min(score, 1.0) // Max 1.0
}

