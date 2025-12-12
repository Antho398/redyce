/**
 * Utilitaires pour la structuration et la normalisation des données IA
 */

/**
 * Nettoie et normalise un texte
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/\n{3,}/g, '\n\n') // Remplacer les retours à la ligne multiples
}

/**
 * Extrait les numéros d'articles d'un texte
 */
export function extractArticleNumbers(text: string): string[] {
  const patterns = [
    /Article\s+(\d+(?:\.\d+)*)/gi,
    /Art\.\s+(\d+(?:\.\d+)*)/gi,
    /^(\d+(?:\.\d+)*)[\.\)]\s+/gm, // Format: 1.1. ou 1.1)
  ]

  const numbers = new Set<string>()

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      numbers.add(match[1] || match[0])
    }
  }

  return Array.from(numbers).sort((a, b) => {
    // Trier numériquement: 1.1 avant 1.2, etc.
    const partsA = a.split('.').map(Number)
    const partsB = b.split('.').map(Number)
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0
      const partB = partsB[i] || 0
      if (partA !== partB) return partA - partB
    }
    return 0
  })
}

/**
 * Valide une structure DPGF extraite
 */
export function validateDPGFStructure(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.titre || typeof data.titre !== 'string') {
    errors.push('Le titre est requis')
  }

  if (!Array.isArray(data.articles)) {
    errors.push('Les articles doivent être un tableau')
  } else {
    data.articles.forEach((article: any, index: number) => {
      if (!article.numero) {
        errors.push(`Article ${index + 1}: le numéro est requis`)
      }
      if (!Array.isArray(article.prescriptions)) {
        errors.push(`Article ${index + 1}: les prescriptions doivent être un tableau`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide une structure CCTP générée
 */
export function validateCCTPStructure(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.projet || !data.projet.nom) {
    errors.push('Le nom du projet est requis')
  }

  if (!Array.isArray(data.sections)) {
    errors.push('Les sections doivent être un tableau')
  }

  if (!Array.isArray(data.prescriptionsTechniques)) {
    errors.push('Les prescriptions techniques doivent être un tableau')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Mélange deux structures DPGF (utile pour fusionner plusieurs extractions)
 */
export function mergeDPGFStructures(
  dpgf1: any,
  dpgf2: any
): any {
  return {
    titre: dpgf1.titre || dpgf2.titre,
    reference: dpgf1.reference || dpgf2.reference,
    dateCreation: dpgf1.dateCreation || dpgf2.dateCreation,
    articles: [...(dpgf1.articles || []), ...(dpgf2.articles || [])],
    materiauxGeneraux: [
      ...(dpgf1.materiauxGeneraux || []),
      ...(dpgf2.materiauxGeneraux || []),
    ],
    normes: [
      ...new Set([...(dpgf1.normes || []), ...(dpgf2.normes || [])]),
    ],
    observations: `${dpgf1.observations || ''}\n${dpgf2.observations || ''}`.trim(),
  }
}

