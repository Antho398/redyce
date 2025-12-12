/**
 * Parser unifié qui route vers le bon parser selon le type MIME
 */

import { parsePDF } from './pdf-parser'
import { parseDOCX } from './docx-parser'
import { parseImage } from './image-parser'
import { ParserResult, SupportedMimeType } from './unified-parser.types'

/**
 * Parse un document en fonction de son type MIME
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ParserResult> {
  const normalizedMimeType = mimeType.toLowerCase() as SupportedMimeType

  switch (normalizedMimeType) {
    case 'application/pdf':
      return {
        type: 'pdf',
        data: await parsePDF(buffer),
      }

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return {
        type: 'docx',
        data: await parseDOCX(buffer),
      }

    case 'image/jpeg':
    case 'image/jpg':
    case 'image/png':
    case 'image/gif':
      return {
        type: 'image',
        data: await parseImage(buffer),
      }

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}. Supported types: PDF, DOCX, JPEG, PNG, GIF`)
  }
}

/**
 * Détecte le type MIME à partir du nom de fichier
 */
export function detectMimeTypeFromFilename(filename: string): SupportedMimeType | null {
  const ext = filename.toLowerCase().split('.').pop()

  const mimeTypes: Record<string, SupportedMimeType> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
  }

  return ext ? mimeTypes[ext] || null : null
}

