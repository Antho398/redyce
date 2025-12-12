/**
 * Parseur PDF
 * Utilise pdf-parse pour extraire le texte et les métadonnées
 */

import pdfParse from 'pdf-parse'
import { ParsedPDF, PDFMetadata } from './pdf-parser.types'

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    const data = await pdfParse(buffer)

    const metadata: PDFMetadata = {
      pages: data.numpages,
      title: data.info?.Title,
      author: data.info?.Author,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
      subject: data.info?.Subject,
      keywords: data.info?.Keywords,
    }

    // Diviser le texte par pages (approximatif)
    const pages = []
    const textPerPage = Math.ceil(data.text.length / data.numpages)
    for (let i = 0; i < data.numpages; i++) {
      const start = i * textPerPage
      const end = Math.min(start + textPerPage, data.text.length)
      pages.push({
        pageNumber: i + 1,
        text: data.text.substring(start, end),
      })
    }

    return {
      text: data.text,
      metadata,
      pages,
    }
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

