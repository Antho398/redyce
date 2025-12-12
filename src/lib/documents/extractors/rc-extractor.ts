/**
 * Extracteur pour les documents RC (Règlement de Consultation)
 */

import { BaseDocumentExtractor } from './base-extractor'
import { ExtractedContent, RCExtraction } from '@/types/documents'
import { ParsedPDF } from '../parser'

export class RCExtractor extends BaseDocumentExtractor {
  async extract(parsedPDF: ParsedPDF): Promise<ExtractedContent> {
    const sections = this.extractSections(parsedPDF.text)

    return {
      text: parsedPDF.text,
      metadata: {
        pages: parsedPDF.metadata.pages,
        title: parsedPDF.metadata.title,
        author: parsedPDF.metadata.author,
        creationDate: parsedPDF.metadata.creationDate,
        modificationDate: parsedPDF.metadata.modificationDate,
      },
      sections,
    }
  }

  async extractSpecific(parsedPDF: ParsedPDF): Promise<RCExtraction> {
    const extractedContent = await this.extract(parsedPDF)

    return {
      documentType: 'RC',
      extractedContent,
      metadata: {},
    }
  }
}

