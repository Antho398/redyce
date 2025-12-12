/**
 * Types pour le traitement de documents
 */

import { DocumentType } from '@/config/constants'

export interface DocumentMetadata {
  pages?: number
  title?: string
  author?: string
  creationDate?: Date
  modificationDate?: Date
  width?: number // Pour les images
  height?: number // Pour les images
  format?: string // Format du fichier
}

export interface ExtractedContent {
  text: string
  metadata: DocumentMetadata
  sections?: DocumentSection[]
}

export interface DocumentSection {
  title: string
  content: string
  pageNumber?: number
  level?: number
}

export interface DocumentExtractionResult {
  documentType: DocumentType
  extractedContent: ExtractedContent
  metadata: Record<string, unknown>
}

export interface CCTPExtraction extends DocumentExtractionResult {
  documentType: 'CCTP'
  // Champs spécifiques CCTP à définir selon vos besoins
}

export interface DPGFExtraction extends DocumentExtractionResult {
  documentType: 'DPGF'
  // Champs spécifiques DPGF
}

export interface RCExtraction extends DocumentExtractionResult {
  documentType: 'RC'
  // Champs spécifiques RC
}

export interface CCAPExtraction extends DocumentExtractionResult {
  documentType: 'CCAP'
  // Champs spécifiques CCAP
}

