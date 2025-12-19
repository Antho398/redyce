/**
 * Utilitaires pour la gestion des placeholders DOCX
 * Mapping entre les questions et leurs identifiants dans le template
 */

/**
 * Génère un placeholder DOCX stable à partir d'un questionId
 * Format: {{Q_<shortId>}} où shortId = 8 premiers caractères du cuid
 * @example generatePlaceholder("clxyz123abc456def") => "{{Q_clxyz123}}"
 */
export function generatePlaceholder(questionId: string): string {
  const shortId = questionId.slice(0, 8).toUpperCase()
  return `{{Q_${shortId}}}`
}

/**
 * Génère un placeholder pour une section
 * Format: {{S_<shortId>}}
 */
export function generateSectionPlaceholder(sectionId: string): string {
  const shortId = sectionId.slice(0, 8).toUpperCase()
  return `{{S_${shortId}}}`
}

/**
 * Extrait l'ID court d'un placeholder
 * @example extractIdFromPlaceholder("{{Q_CLXYZ123}}") => "CLXYZ123"
 */
export function extractIdFromPlaceholder(placeholder: string): string | null {
  const match = placeholder.match(/\{\{[QS]_([A-Z0-9]+)\}\}/)
  return match ? match[1] : null
}

/**
 * Interface pour le mapping question → réponse avec placeholder
 */
export interface QuestionAnswerMapping {
  questionId: string
  placeholder: string
  sectionId?: string
  sectionPlaceholder?: string
  question: string
  answer: string | null
  order: number
}

/**
 * Génère le mapping complet pour un mémoire
 * Utilisé pour préparer l'injection dans le DOCX
 */
export function generateMemoireMapping(
  sections: Array<{
    id: string
    title: string
    order: number
    templateQuestionId?: string
    content?: string | null
  }>
): QuestionAnswerMapping[] {
  return sections.map(section => ({
    questionId: section.templateQuestionId || section.id,
    placeholder: generatePlaceholder(section.templateQuestionId || section.id),
    question: section.title,
    answer: section.content || null,
    order: section.order,
  }))
}

/**
 * Vérifie si un template est compatible avec l'injection DOCX
 */
export function isDocxCompatible(mimeType?: string | null): boolean {
  if (!mimeType) return false
  return (
    mimeType.includes('word') ||
    mimeType.includes('msword') ||
    mimeType.includes('openxmlformats-officedocument.wordprocessingml')
  )
}

/**
 * Vérifie si un template est un PDF
 */
export function isPdfTemplate(mimeType?: string | null): boolean {
  if (!mimeType) return false
  return mimeType.includes('pdf')
}

/**
 * Messages d'aide pour l'export
 */
export const EXPORT_MESSAGES = {
  DOCX_COMPATIBLE: {
    title: 'Compatible injection DOCX',
    description: 'Les réponses pourront être automatiquement insérées dans votre document.',
    icon: 'check',
  },
  PDF_ONLY: {
    title: 'Export manuel requis',
    description: 'Template PDF détecté. Les réponses devront être copiées-collées manuellement.',
    icon: 'info',
  },
  NO_TEMPLATE: {
    title: 'Aucun template',
    description: 'Aucun template associé à ce mémoire.',
    icon: 'warning',
  },
} as const


