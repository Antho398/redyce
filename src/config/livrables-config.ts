/**
 * Configuration des livrables techniques
 * Définit les métadonnées et comportements pour chaque type de livrable
 */

import { LivrableConfig, LivrableType } from '@/types/livrables'
import { Package, FileCheck } from 'lucide-react'

export const LIVRABLES_CONFIG: Record<LivrableType, LivrableConfig> = {
  [LivrableType.DPGF]: {
    type: LivrableType.DPGF,
    name: 'DPGF',
    description: 'Décomposition des Prix Globaux et Forfaitaires - Structuration des données de prix depuis vos documents.',
    icon: Package,
    apiEndpoint: '/api/dpgf',
    requiresDocuments: true,
    canGenerateFromDocuments: true,
    canGenerateFromDPGF: false,
    requiresDPGF: false,
  },
  [LivrableType.CCTP]: {
    type: LivrableType.CCTP,
    name: 'CCTP',
    description: 'Cahier des Clauses Techniques Particulières - Génération automatique depuis un DPGF ou des documents.',
    icon: FileCheck,
    apiEndpoint: '/api/cctp',
    requiresDocuments: true,
    canGenerateFromDocuments: true,
    canGenerateFromDPGF: true,
    requiresDPGF: false,
  },
}

export function getLivrableConfig(type: LivrableType): LivrableConfig {
  return LIVRABLES_CONFIG[type]
}

export function getAllLivrablesConfig(): LivrableConfig[] {
  return Object.values(LIVRABLES_CONFIG)
}

