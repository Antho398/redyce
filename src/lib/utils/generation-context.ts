/**
 * Utilitaires pour gérer le contexte de génération IA
 * Calcule et compare les hashes des sources pour détecter les sections obsolètes
 */

import crypto from 'crypto'

/**
 * Structure du contexte de génération stocké en base
 */
export interface GenerationContext {
  // Hash du profil entreprise (CompanyProfile.dataJson)
  companyProfileHash?: string

  // Hash des exigences utilisées (liste des IDs + contenus)
  requirementsHash?: string

  // Hash des documents de référence (CompanyDoc extractedContent)
  companyDocsHash?: string

  // Hash de la question elle-même
  questionHash?: string

  // Timestamp de génération
  generatedAt: string

  // Version des sources (pour débogage)
  sourceVersions?: {
    companyProfileUpdatedAt?: string
    requirementsCount?: number
    companyDocsCount?: number
  }
}

/**
 * Calcule un hash MD5 d'une chaîne
 */
function hashString(content: string): string {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex').substring(0, 16)
}

/**
 * Calcule le hash du profil entreprise
 */
export function computeCompanyProfileHash(dataJson: Record<string, unknown> | null): string {
  if (!dataJson) return ''
  // Trier les clés pour un hash consistant
  const sorted = JSON.stringify(dataJson, Object.keys(dataJson).sort())
  return hashString(sorted)
}

/**
 * Calcule le hash des exigences
 * Prend en compte l'ID, le titre et le contenu de chaque exigence
 */
export function computeRequirementsHash(requirements: Array<{ id: string; title?: string; content?: string }>): string {
  if (!requirements || requirements.length === 0) return ''

  // Trier par ID pour un hash consistant
  const sorted = requirements
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(r => `${r.id}:${r.title || ''}:${r.content || ''}`)
    .join('|')

  return hashString(sorted)
}

/**
 * Calcule le hash des documents entreprise
 * Prend en compte l'ID et le contenu extrait
 */
export function computeCompanyDocsHash(docs: Array<{ id: string; extractedContent?: string }>): string {
  if (!docs || docs.length === 0) return ''

  // Trier par ID pour un hash consistant
  const sorted = docs
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(d => `${d.id}:${d.extractedContent || ''}`)
    .join('|')

  return hashString(sorted)
}

/**
 * Calcule le hash de la question
 */
export function computeQuestionHash(question: string | null | undefined): string {
  if (!question) return ''
  return hashString(question)
}

/**
 * Compare deux contextes de génération et retourne les différences
 */
export function compareContexts(
  stored: GenerationContext | null | undefined,
  current: Partial<GenerationContext>
): {
  isStale: boolean
  changes: Array<'companyProfile' | 'requirements' | 'companyDocs' | 'question'>
} {
  if (!stored) {
    return { isStale: false, changes: [] } // Pas de contexte = pas généré par IA
  }

  const changes: Array<'companyProfile' | 'requirements' | 'companyDocs' | 'question'> = []

  if (current.companyProfileHash && stored.companyProfileHash !== current.companyProfileHash) {
    changes.push('companyProfile')
  }
  if (current.requirementsHash && stored.requirementsHash !== current.requirementsHash) {
    changes.push('requirements')
  }
  if (current.companyDocsHash && stored.companyDocsHash !== current.companyDocsHash) {
    changes.push('companyDocs')
  }
  if (current.questionHash && stored.questionHash !== current.questionHash) {
    changes.push('question')
  }

  return {
    isStale: changes.length > 0,
    changes,
  }
}

/**
 * Crée un contexte de génération complet
 */
export function createGenerationContext(params: {
  companyProfile?: Record<string, unknown> | null
  requirements?: Array<{ id: string; title?: string; content?: string }>
  companyDocs?: Array<{ id: string; extractedContent?: string }>
  question?: string | null
}): GenerationContext {
  return {
    companyProfileHash: computeCompanyProfileHash(params.companyProfile ?? null),
    requirementsHash: computeRequirementsHash(params.requirements ?? []),
    companyDocsHash: computeCompanyDocsHash(params.companyDocs ?? []),
    questionHash: computeQuestionHash(params.question),
    generatedAt: new Date().toISOString(),
    sourceVersions: {
      requirementsCount: params.requirements?.length ?? 0,
      companyDocsCount: params.companyDocs?.length ?? 0,
    },
  }
}

/**
 * Messages lisibles pour les changements détectés
 */
export const CHANGE_LABELS: Record<string, string> = {
  companyProfile: 'Profil entreprise modifié',
  requirements: 'Exigences modifiées',
  companyDocs: 'Documents de référence modifiés',
  question: 'Question modifiée',
}
