/**
 * Parseur d'images avec OCR
 * Utilise Tesseract.js pour l'extraction de texte
 */

import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { ParsedImage, ImageMetadata } from './image-parser.types'

/**
 * Parse une image et extrait le texte via OCR
 */
export async function parseImage(buffer: Buffer): Promise<ParsedImage> {
  try {
    // 1. Obtenir les métadonnées de l'image avec sharp
    const imageMetadata = await getImageMetadata(buffer)

    // 2. Optimiser l'image pour OCR (augmenter le contraste, réduire le bruit)
    const optimizedBuffer = await optimizeImageForOCR(buffer)

    // 3. Exécuter OCR avec Tesseract
    const worker = await createWorker('fra+eng') // Français et Anglais
    const { data } = await worker.recognize(optimizedBuffer)
    await worker.terminate()

    // 4. Construire le résultat
    const words = data.words.map(word => ({
      text: word.text,
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1,
      },
      confidence: word.confidence / 100, // Convertir de 0-100 à 0-1
    }))

    // Calculer la confiance moyenne
    const avgConfidence = words.length > 0
      ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
      : 0

    return {
      text: data.text,
      metadata: imageMetadata,
      confidence: avgConfidence,
      ocrData: {
        words,
      },
    }
  } catch (error) {
    throw new Error(`Failed to parse image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Obtient les métadonnées de l'image
 */
async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    }
  } catch (error) {
    // Si l'image ne peut pas être lue, retourner des métadonnées minimales
    return {
      size: buffer.length,
    }
  }
}

/**
 * Optimise l'image pour améliorer les résultats OCR
 */
async function optimizeImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .greyscale() // Conversion en niveaux de gris
      .normalize() // Normalisation de l'intensité
      .sharpen() // Amélioration de la netteté
      .toBuffer()
  } catch (error) {
    // Si l'optimisation échoue, retourner l'image originale
    return buffer
  }
}

