/**
 * Helpers pour la gestion de l'upload de documents
 * Fonctions pures pour la logique métier
 */

export interface PendingFile {
  id: string
  file: File
  documentType?: string
  error?: string
}

/**
 * Applique le documentType à tous les fichiers pending qui n'en ont pas
 */
export function applyDocTypeToPendingFiles(
  files: PendingFile[],
  documentType: string
): PendingFile[] {
  return files.map((file) => {
    if (!file.documentType) {
      return {
        ...file,
        documentType,
        error: undefined, // Supprimer l'erreur "type manquant" si elle existe
      }
    }
    return file
  })
}

/**
 * Vérifie si un fichier pending a un documentType manquant
 */
export function hasMissingDocType(file: PendingFile): boolean {
  return !file.documentType || file.documentType.trim() === ''
}

/**
 * Vérifie si au moins un fichier pending a un documentType manquant
 */
export function hasAnyMissingDocType(files: PendingFile[]): boolean {
  return files.some(hasMissingDocType)
}

/**
 * Ajoute un documentType à un fichier lors de sa sélection
 */
export function addFileWithDocType(
  file: File,
  documentType: string | undefined,
  existingFiles: PendingFile[]
): PendingFile {
  const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  const error = !documentType ? 'Veuillez sélectionner un type de document' : undefined

  return {
    id,
    file,
    documentType: documentType || undefined,
    error,
  }
}

/**
 * Met à jour le documentType d'un fichier spécifique
 */
export function updateFileDocType(
  files: PendingFile[],
  fileId: string,
  documentType: string
): PendingFile[] {
  return files.map((f) => {
    if (f.id === fileId) {
      return {
        ...f,
        documentType,
        error: undefined,
      }
    }
    return f
  })
}

