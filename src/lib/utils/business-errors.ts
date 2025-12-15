/**
 * Messages d'erreur métier clairs pour l'UI
 * Aucune stacktrace, messages compréhensibles pour un chargé d'affaires
 */

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export const BusinessErrors = {
  // Template mémoire
  NO_TEMPLATE: new BusinessError(
    'No MODELE_MEMOIRE document found',
    'NO_TEMPLATE',
    'Aucun modèle de mémoire trouvé. Veuillez uploader un document de type "Modèle mémoire" dans ce projet.'
  ),

  // Export
  EXPORT_PARTIAL: new BusinessError(
    'Export contains empty sections',
    'EXPORT_PARTIAL',
    'Certaines sections sont vides. L\'export sera partiel.'
  ),
  EXPORT_NO_SECTIONS: new BusinessError(
    'No sections found for export',
    'EXPORT_NO_SECTIONS',
    'Aucune section trouvée dans ce mémoire. Impossible d\'exporter.'
  ),

  // IA
  IA_INSUFFICIENT_CONTEXT: new BusinessError(
    'Insufficient context for AI generation',
    'IA_INSUFFICIENT_CONTEXT',
    'Contexte insuffisant pour générer une réponse. Veuillez uploader des documents sources ou compléter votre profil entreprise.'
  ),
  IA_NO_DOCUMENTS: new BusinessError(
    'No source documents available',
    'IA_NO_DOCUMENTS',
    'Aucun document source disponible. Uploader des documents (AE, RC, CCAP, CCTP, DPGF) pour améliorer la qualité des réponses IA.'
  ),
  IA_NO_TEMPLATE: new BusinessError(
    'No template available for context',
    'IA_NO_TEMPLATE',
    'Le modèle de mémoire n\'est pas disponible. Impossible de générer une réponse contextuelle.'
  ),

  // Projet
  PROJECT_NO_DOCUMENTS: new BusinessError(
    'Project has no documents',
    'PROJECT_NO_DOCUMENTS',
    'Ce projet ne contient aucun document. Ajoutez des documents sources pour commencer.'
  ),

  // Mémoire
  MEMOIRE_NO_SECTIONS: new BusinessError(
    'Memoire has no sections',
    'MEMOIRE_NO_SECTIONS',
    'Ce mémoire ne contient aucune section. Veuillez créer une nouvelle version ou contacter le support.'
  ),

  // Exigences
  NO_REQUIREMENTS: new BusinessError(
    'No requirements extracted yet',
    'NO_REQUIREMENTS',
    'Aucune exigence extraite. Cliquez sur "Analyser le dossier" pour extraire les exigences depuis vos documents.'
  ),

  // Versioning
  MEMOIRE_FROZEN: new BusinessError(
    'Memoire is frozen',
    'MEMOIRE_FROZEN',
    'Cette version est figée et ne peut plus être modifiée. Créez une nouvelle version pour continuer à travailler.'
  ),

  // Collaboration
  INSUFFICIENT_PERMISSIONS: new BusinessError(
    'Insufficient permissions',
    'INSUFFICIENT_PERMISSIONS',
    'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.'
  ),
}

/**
 * Extrait un message utilisateur à partir d'une erreur
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof BusinessError) {
    return error.userMessage
  }

  if (error instanceof Error) {
    // Messages d'erreur techniques transformés en messages métier
    if (error.message.includes('MODELE_MEMOIRE')) {
      return BusinessErrors.NO_TEMPLATE.userMessage
    }
    if (error.message.includes('frozen')) {
      return BusinessErrors.MEMOIRE_FROZEN.userMessage
    }
    if (error.message.includes('permission') || error.message.includes('access')) {
      return BusinessErrors.INSUFFICIENT_PERMISSIONS.userMessage
    }
  }

  // Message générique par défaut
  return 'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
}

