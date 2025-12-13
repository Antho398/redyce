/**
 * Pipeline de génération de CCTP
 * Génère un CCTP complet à partir d'un DPGF structuré
 */

import { iaClient } from '../client'
import { CCTP_GENERATION_SYSTEM_PROMPT, buildCCTPGenerationPrompt } from '../prompts/cctp-generation'
import type { DPGFExtractedData } from './dpgf-extraction-pipeline'

export interface CCTPGeneratedData {
  projet: {
    nom: string
    reference?: string
    lieu?: string
  }
  sections: Array<{
    titre: string
    contenu: string
  }>
  prescriptionsTechniques: Array<{
    article: string
    titre: string
    description: string
    exigences: string[]
    materiaux?: string[]
    normes?: string[]
    critereReception?: string
  }>
  reception?: {
    conditions?: string
    documents?: string
    essais?: string
  }
  annexes?: Array<{
    titre: string
    contenu: string
  }>
}

export interface CCTPGenerationPipelineOptions {
  projectName: string
  dpgfData: DPGFExtractedData
  userRequirements?: string
  additionalContext?: string
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

export interface CCTPGenerationResult {
  data: CCTPGeneratedData
  rawResponse?: string
  metadata?: {
    tokensUsed?: number
    model?: string
  }
}

/**
 * Pipeline principal de génération CCTP
 */
export async function generateCCTPPipeline(
  options: CCTPGenerationPipelineOptions
): Promise<CCTPGenerationResult> {
  try {
    // 1. Construire le prompt de génération
    const prompt = buildCCTPGenerationPrompt({
      projectName: options.projectName,
      dpgfData: options.dpgfData,
      userRequirements: options.userRequirements,
      additionalContext: options.additionalContext,
    })

    // 2. Générer le CCTP structuré en JSON
    const response = await iaClient.generateJSONResponse<CCTPGeneratedData>(
      {
        system: CCTP_GENERATION_SYSTEM_PROMPT,
        user: prompt,
      },
      {
        model: options.model || 'gpt-4-turbo-preview',
        temperature: options.temperature ?? 0.7, // Température moyenne pour génération créative mais cohérente
        maxTokens: 4000,
        tracking: options.tracking,
      }
    )

    // 3. Normaliser les données
    const normalizedData = normalizeCCTPData(response, options.projectName)

    return {
      data: normalizedData,
      metadata: {
        model: options.model || 'gpt-4-turbo-preview',
      },
    }
  } catch (error) {
    console.error('CCTP generation pipeline error:', error)
    throw new Error(
      `Failed to generate CCTP: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Normalise les données générées pour s'assurer qu'elles respectent le schéma
 */
function normalizeCCTPData(data: any, projectName: string): CCTPGeneratedData {
  return {
    projet: {
      nom: data.projet?.nom || projectName,
      reference: data.projet?.reference,
      lieu: data.projet?.lieu,
    },
    sections: Array.isArray(data.sections)
      ? data.sections.map((section: any) => ({
          titre: section.titre || '',
          contenu: section.contenu || '',
        }))
      : [],
    prescriptionsTechniques: Array.isArray(data.prescriptionsTechniques)
      ? data.prescriptionsTechniques.map((presc: any) => ({
          article: presc.article || '',
          titre: presc.titre || '',
          description: presc.description || '',
          exigences: Array.isArray(presc.exigences) ? presc.exigences : [],
          materiaux: Array.isArray(presc.materiaux) ? presc.materiaux : undefined,
          normes: Array.isArray(presc.normes) ? presc.normes : undefined,
          critereReception: presc.critereReception,
        }))
      : [],
    reception: data.reception
      ? {
          conditions: data.reception.conditions,
          documents: data.reception.documents,
          essais: data.reception.essais,
        }
      : undefined,
    annexes: Array.isArray(data.annexes)
      ? data.annexes.map((annexe: any) => ({
          titre: annexe.titre || '',
          contenu: annexe.contenu || '',
        }))
      : [],
  }
}

/**
 * Convertit les données CCTP structurées en texte formaté
 */
export function formatCCTPAsText(data: CCTPGeneratedData): string {
  let text = `CCTP - ${data.projet.nom}\n`
  if (data.projet.reference) {
    text += `Référence: ${data.projet.reference}\n`
  }
  if (data.projet.lieu) {
    text += `Lieu: ${data.projet.lieu}\n`
  }
  text += '\n' + '='.repeat(50) + '\n\n'

  // Sections
  for (const section of data.sections) {
    text += `${section.titre}\n`
    text += '-'.repeat(50) + '\n'
    text += `${section.contenu}\n\n`
  }

  // Prescriptions techniques
  if (data.prescriptionsTechniques.length > 0) {
    text += '\nPRESCRIPTIONS TECHNIQUES\n'
    text += '='.repeat(50) + '\n\n'
    for (const presc of data.prescriptionsTechniques) {
      text += `${presc.article} - ${presc.titre}\n`
      text += `${presc.description}\n`
      if (presc.exigences.length > 0) {
        text += '\nExigences:\n'
        presc.exigences.forEach(ex => {
          text += `  - ${ex}\n`
        })
      }
      if (presc.materiaux && presc.materiaux.length > 0) {
        text += '\nMatériaux:\n'
        presc.materiaux.forEach(m => {
          text += `  - ${m}\n`
        })
      }
      if (presc.normes && presc.normes.length > 0) {
        text += '\nNormes:\n'
        presc.normes.forEach(n => {
          text += `  - ${n}\n`
        })
      }
      if (presc.critereReception) {
        text += `\nCritères de réception: ${presc.critereReception}\n`
      }
      text += '\n'
    }
  }

  // Réception
  if (data.reception) {
    text += '\nRÉCEPTION DES TRAVAUX\n'
    text += '='.repeat(50) + '\n'
    if (data.reception.conditions) {
      text += `\nConditions: ${data.reception.conditions}\n`
    }
    if (data.reception.documents) {
      text += `\nDocuments à fournir: ${data.reception.documents}\n`
    }
    if (data.reception.essais) {
      text += `\nEssais: ${data.reception.essais}\n`
    }
  }

  // Annexes
  if (data.annexes && data.annexes.length > 0) {
    text += '\n\nANNEXES\n'
    text += '='.repeat(50) + '\n'
    for (const annexe of data.annexes) {
      text += `\n${annexe.titre}\n`
      text += '-'.repeat(50) + '\n'
      text += `${annexe.contenu}\n\n`
    }
  }

  return text
}

