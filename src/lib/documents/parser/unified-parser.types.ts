/**
 * Types unifiés pour tous les parsers
 */

import { ParsedPDF } from './pdf-parser.types'
import { ParsedDOCX } from './docx-parser.types'
import { ParsedImage } from './image-parser.types'

export type ParsedDocument = ParsedPDF | ParsedDOCX | ParsedImage

export interface ParserResult {
  type: 'pdf' | 'docx' | 'image'
  data: ParsedDocument
}

export type SupportedMimeType = 
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'

