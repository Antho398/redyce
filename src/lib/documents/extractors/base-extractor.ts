/**
 * Classe de base pour les extracteurs de documents
 */

import { ExtractedContent, DocumentSection } from '@/types/documents'
import { ParsedPDF } from '../parser'

export abstract class BaseDocumentExtractor {
  abstract extract(parsedPDF: ParsedPDF): Promise<ExtractedContent>

  /**
   * Méthode utilitaire pour diviser le texte en sections
   */
  protected extractSections(text: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    const lines = text.split('\n')
    let currentSection: DocumentSection | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Détection simple de titres (lignes courtes, en majuscules, ou numérotées)
      if (this.isTitle(line)) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line,
          content: '',
          level: this.getTitleLevel(line),
        }
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? '\n' : '') + line
      }
    }

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  private isTitle(line: string): boolean {
    // Ligne courte (< 100 caractères) qui pourrait être un titre
    if (line.length > 100) return false

    // Commence par un numéro (1., 1.1, etc.)
    if (/^\d+[\.\)]/.test(line)) return true

    // Tout en majuscules (probable titre)
    if (line === line.toUpperCase() && line.length > 3) return true

    return false
  }

  private getTitleLevel(line: string): number {
    // Détermine le niveau de titre basé sur la numérotation
    const match = line.match(/^(\d+)(\.\d+)*/)
    if (match) {
      return match[0].split('.').length
    }
    return 1
  }
}

