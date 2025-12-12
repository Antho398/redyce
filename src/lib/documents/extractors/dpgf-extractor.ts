/**
 * Extracteur pour les documents DPGF (Dossier de Prescription Générale de Fourniture)
 */

import { BaseDocumentExtractor } from './base-extractor'
import { ExtractedContent, DPGFExtraction } from '@/types/documents'
import { ParsedPDF } from '../parser'

export class DPGFExtractor extends BaseDocumentExtractor {
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

  async extractSpecific(parsedPDF: ParsedPDF): Promise<DPGFExtraction> {
    const extractedContent = await this.extract(parsedPDF)

    return {
      documentType: 'DPGF',
      extractedContent,
      metadata: {},
    }
  }
}

