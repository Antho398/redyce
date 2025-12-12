/**
 * Extracteur pour les documents CCTP (Cahier des Clauses Techniques Particulières)
 */

import { BaseDocumentExtractor } from './base-extractor'
import { ExtractedContent, CCTPExtraction } from '@/types/documents'
import { ParsedPDF } from '../parser'

export class CCTPExtractor extends BaseDocumentExtractor {
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

  /**
   * Extraction spécifique CCTP
   * À enrichir selon les besoins réels
   */
  async extractSpecific(parsedPDF: ParsedPDF): Promise<CCTPExtraction> {
    const extractedContent = await this.extract(parsedPDF)

    return {
      documentType: 'CCTP',
      extractedContent,
      metadata: {
        // Ajouter des métadonnées spécifiques CCTP ici
      },
    }
  }
}

