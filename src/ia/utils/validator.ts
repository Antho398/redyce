/**
 * Utilitaires de validation pour les résultats IA
 */

import { validateDPGFStructure, validateCCTPStructure } from './structurizer'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Valide un résultat d'extraction DPGF
 */
export function validateDPGFExtraction(data: any): ValidationResult {
  const { valid, errors } = validateDPGFStructure(data)
  const warnings: string[] = []

  // Vérifications additionnelles avec warnings
  if (!data.reference) {
    warnings.push('Aucune référence trouvée dans le DPGF')
  }

  if (!data.articles || data.articles.length === 0) {
    warnings.push('Aucun article trouvé dans le DPGF')
  } else if (data.articles.length < 3) {
    warnings.push(`Peu d'articles trouvés (${data.articles.length}), l'extraction pourrait être incomplète`)
  }

  if (!data.normes || data.normes.length === 0) {
    warnings.push('Aucune norme référencée trouvée')
  }

  return {
    valid,
    errors,
    warnings,
  }
}

/**
 * Valide un résultat de génération CCTP
 */
export function validateCCTPGeneration(data: any): ValidationResult {
  const { valid, errors } = validateCCTPStructure(data)
  const warnings: string[] = []

  // Vérifications additionnelles
  if (!data.sections || data.sections.length === 0) {
    warnings.push('Aucune section générée dans le CCTP')
  }

  if (!data.prescriptionsTechniques || data.prescriptionsTechniques.length === 0) {
    warnings.push('Aucune prescription technique générée')
  }

  // Vérifier la complétude des prescriptions
  if (data.prescriptionsTechniques) {
    data.prescriptionsTechniques.forEach((presc: any, index: number) => {
      if (!presc.description || presc.description.length < 50) {
        warnings.push(`Prescription ${index + 1}: description peut-être trop courte`)
      }
      if (!presc.exigences || presc.exigences.length === 0) {
        warnings.push(`Prescription ${index + 1}: aucune exigence spécifiée`)
      }
    })
  }

  return {
    valid,
    errors,
    warnings,
  }
}

/**
 * Valide qu'un score de confiance est dans une plage acceptable
 */
export function validateConfidenceScore(score: number | null | undefined): {
  valid: boolean
  message?: string
} {
  if (score === null || score === undefined) {
    return {
      valid: false,
      message: 'Score de confiance manquant',
    }
  }

  if (score < 0 || score > 1) {
    return {
      valid: false,
      message: `Score de confiance invalide: ${score} (doit être entre 0 et 1)`,
    }
  }

  if (score < 0.5) {
    return {
      valid: true,
      message: 'Score de confiance faible, vérification recommandée',
    }
  }

  return { valid: true }
}

