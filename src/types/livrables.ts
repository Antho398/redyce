/**
 * Configuration et types pour les livrables techniques Redyce
 * Architecture générique et scalable pour DPGF, CCTP et futurs livrables
 */

export enum LivrableType {
  DPGF = 'DPGF',
  CCTP = 'CCTP',
  // Futurs livrables peuvent être ajoutés ici
  // RC = 'RC',
  // CCAP = 'CCAP',
}

export interface LivrableConfig {
  type: LivrableType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  apiEndpoint: string
  requiresDocuments?: boolean
  canGenerateFromDocuments?: boolean
  canGenerateFromDPGF?: boolean
  requiresDPGF?: boolean
}

export type LivrableStatus =
  | 'no_documents' // Aucun document source
  | 'documents_not_analyzed' // Documents uploadés mais non analysés
  | 'ready_to_generate' // Prêt à générer
  | 'generating' // En cours de génération
  | 'generated' // Généré avec succès
  | 'error' // Erreur de génération

export interface DocumentSource {
  id: string
  name: string
  fileName: string
  status: string
  documentType?: string | null
  createdAt: string
}

export interface LivrableData {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  [key: string]: any // Permet d'accepter différentes structures selon le type
}

