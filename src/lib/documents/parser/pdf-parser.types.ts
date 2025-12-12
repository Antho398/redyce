/**
 * Types pour le parsing PDF
 */

export interface PDFMetadata {
  pages: number
  title?: string
  author?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  subject?: string
  keywords?: string
}

export interface ParsedPDF {
  text: string
  metadata: PDFMetadata
  pages: PDFPage[]
}

export interface PDFPage {
  pageNumber: number
  text: string
}

