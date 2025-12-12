/**
 * Extracteur pour les documents CCAP (Cahier des Clauses Administratives Particulières)
 */

import { BaseDocumentExtractor } from './base-extractor'
import { ExtractedContent, CCAPExtraction } from '@/types/documents'
import { ParsedPDF } from '../parser'

export class CCAPExtractor extends BaseDocumentExtractor {
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

  async extractSpecific(parsedPDF: ParsedPDF): Promise<CCAPExtraction> {
    const extractedContent = await this.extract(parsedPDF)

    return {
      documentType: 'CCAP',
      extractedContent,
      metadata: {},
    }
  }
}

