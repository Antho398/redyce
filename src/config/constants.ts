/**
 * Constantes système de l'application
 */

export const APP_CONFIG = {
  name: 'Redyce',
  version: '0.1.0',
  description: 'Génération de mémoires techniques avec IA',
} as const

export const DOCUMENT_TYPES = {
  AE: 'AE',
  RC: 'RC',
  CCAP: 'CCAP',
  CCTP: 'CCTP',
  DPGF: 'DPGF',
  MODELE_MEMOIRE: 'MODELE_MEMOIRE',
  AUTRE: 'AUTRE',
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

export const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  ERROR: 'error',
} as const

export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const

export const MEMORY_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const

export const ANALYSIS_TYPES = {
  EXTRACTION: 'extraction',
  SUMMARY: 'summary',
  QA: 'qa',
  FULL: 'full',
} as const

export const FILE_EXTENSIONS = {
  PDF: ['.pdf'],
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif'],
  DOCUMENTS: ['.doc', '.docx', '.txt'],
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

