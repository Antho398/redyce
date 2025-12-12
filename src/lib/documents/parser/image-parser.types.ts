/**
 * Types pour le parsing d'images avec OCR
 */

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size?: number // Taille en bytes
}

export interface ParsedImage {
  text: string // Texte extrait via OCR
  metadata: ImageMetadata
  confidence?: number // Score de confiance OCR (0-1)
  ocrData?: {
    words: Array<{
      text: string
      bbox: { x0: number; y0: number; x1: number; y1: number }
      confidence: number
    }>
  }
}

