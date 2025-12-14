/**
 * Utilitaires pour les documents
 */

import { File, FileText, Image as ImageIcon } from 'lucide-react'
import { ComponentType } from 'react'

/**
 * Formate la taille d'un fichier en bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Formate une date au format français
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Retourne l'icône appropriée selon le type MIME
 */
export function getFileIcon(mimeType: string): ComponentType<{ className?: string }> {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return File
}

