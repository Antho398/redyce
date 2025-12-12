/**
 * Types pour le parsing DOCX
 */

export interface DOCXMetadata {
  pages?: number // Approximatif pour DOCX
  title?: string
  author?: string
  creationDate?: Date
  modificationDate?: Date
}

export interface ParsedDOCX {
  text: string
  html?: string // HTML conservé si disponible
  metadata: DOCXMetadata
  sections?: DOCXSection[]
}

export interface DOCXSection {
  level: number
  title?: string
  content: string
}

