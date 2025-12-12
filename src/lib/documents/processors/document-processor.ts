/**
 * Orchestrateur de traitement documentaire
 * Gère le parsing et l'extraction selon le type de document
 * Supporte maintenant PDF, DOCX et images (via OCR)
 */

import { parseDocument } from '../parser'
import { CCTPExtractor } from '../extractors/cctp-extractor'
import { DPGFExtractor } from '../extractors/dpgf-extractor'
import { RCExtractor } from '../extractors/rc-extractor'
import { CCAPExtractor } from '../extractors/ccap-extractor'
import { DocumentExtractionResult } from '@/types/documents'
import { DOCUMENT_TYPES } from '@/config/constants'
import type { ParsedPDF } from '../parser'

export class DocumentProcessor {
  private extractors = {
    [DOCUMENT_TYPES.CCTP]: new CCTPExtractor(),
    [DOCUMENT_TYPES.DPGF]: new DPGFExtractor(),
    [DOCUMENT_TYPES.RC]: new RCExtractor(),
    [DOCUMENT_TYPES.CCAP]: new CCAPExtractor(),
  }

  /**
   * Traite un document (PDF, DOCX ou image) et extrait son contenu
   * @param buffer Buffer du fichier
   * @param mimeType Type MIME du fichier (ex: 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
   * @param documentType Type de document métier (CCTP, DPGF, RC, CCAP)
   */
  async processDocument(
    buffer: Buffer,
    mimeType: string,
    documentType: string = DOCUMENT_TYPES.OTHER
  ): Promise<DocumentExtractionResult> {
    // 1. Parser le document selon son type MIME
    const parsedResult = await parseDocument(buffer, mimeType)

    // 2. Convertir le résultat parsé en format unifié
    const extractedContent = this.convertParsedToExtractedContent(parsedResult)

    // 3. Si c'est un PDF et qu'on a un extracteur spécifique, l'utiliser
    if (parsedResult.type === 'pdf' && this.isPDFExtractable(documentType)) {
      const parsedPDF = parsedResult.data as ParsedPDF
      const extractor = this.extractors[documentType as keyof typeof this.extractors]
      
      if (extractor) {
        switch (documentType) {
          case DOCUMENT_TYPES.CCTP:
            return (extractor as CCTPExtractor).extractSpecific(parsedPDF)
          case DOCUMENT_TYPES.DPGF:
            return (extractor as DPGFExtractor).extractSpecific(parsedPDF)
          case DOCUMENT_TYPES.RC:
            return (extractor as RCExtractor).extractSpecific(parsedPDF)
          case DOCUMENT_TYPES.CCAP:
            return (extractor as CCAPExtractor).extractSpecific(parsedPDF)
        }
      }
    }

    // 4. Sinon, retourner l'extraction générique
    return {
      documentType: documentType as any,
      extractedContent,
      metadata: {
        parserType: parsedResult.type,
        ...extractedContent.metadata,
      },
    }
  }

  /**
   * Convertit le résultat parsé en format ExtractedContent unifié
   */
  private convertParsedToExtractedContent(parsedResult: any) {
    switch (parsedResult.type) {
      case 'pdf': {
        const pdf = parsedResult.data
        return {
          text: pdf.text,
          metadata: {
            pages: pdf.metadata.pages,
            title: pdf.metadata.title,
            author: pdf.metadata.author,
            creationDate: pdf.metadata.creationDate,
            modificationDate: pdf.metadata.modificationDate,
          },
          sections: pdf.pages?.map((page: any) => ({
            title: `Page ${page.pageNumber}`,
            content: page.text,
            pageNumber: page.pageNumber,
            level: 1,
          })),
        }
      }

      case 'docx': {
        const docx = parsedResult.data
        return {
          text: docx.text,
          metadata: {
            pages: docx.metadata.pages,
            title: docx.metadata.title,
            author: docx.metadata.author,
            creationDate: docx.metadata.creationDate,
            modificationDate: docx.metadata.modificationDate,
          },
          sections: docx.sections?.map((section: any) => ({
            title: section.title || '',
            content: section.content,
            level: section.level || 1,
          })),
        }
      }

      case 'image': {
        const image = parsedResult.data
        return {
          text: image.text,
          metadata: {
            width: image.metadata.width,
            height: image.metadata.height,
            format: image.metadata.format,
          },
        }
      }

      default:
        throw new Error(`Unsupported parser type: ${parsedResult.type}`)
    }
  }

  /**
   * Vérifie si un type de document peut utiliser les extracteurs PDF spécialisés
   */
  private isPDFExtractable(documentType: string): boolean {
    return [
      DOCUMENT_TYPES.CCTP,
      DOCUMENT_TYPES.DPGF,
      DOCUMENT_TYPES.RC,
      DOCUMENT_TYPES.CCAP,
    ].includes(documentType as any)
  }
}

