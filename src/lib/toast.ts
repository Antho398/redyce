/**
 * Utilitaire pour afficher des toasts/notifications
 * Wrapper autour de sonner pour une utilisation simple
 */

import { toast as sonnerToast } from 'sonner'

/**
 * Affiche un toast de succès
 */
export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 4000,
  })
}

/**
 * Affiche un toast d'erreur
 */
export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    duration: 5000,
  })
}

/**
 * Affiche un toast d'information
 */
export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 4000,
  })
}

/**
 * Affiche un toast d'avertissement
 */
export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * Affiche un toast de chargement
 */
export function toastLoading(message: string) {
  return sonnerToast.loading(message)
}

/**
 * Exporte aussi toast directement pour un usage avancé
 */
export { sonnerToast as toast }

