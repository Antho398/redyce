/**
 * Parseur DOCX
 * Utilise mammoth pour extraire le texte et le HTML
 */

import mammoth from 'mammoth'
import { ParsedDOCX, DOCXMetadata } from './docx-parser.types'

export async function parseDOCX(buffer: Buffer): Promise<ParsedDOCX> {
  try {
    // Extraction du texte brut
    const textResult = await mammoth.extractRawText({ buffer })
    
    // Extraction HTML pour conserver le formatage
    const htmlResult = await mammoth.convertToHtml({ buffer })

    // Conversion en sections basiques
    const sections = extractSections(textResult.value)

    const metadata: DOCXMetadata = {
      // DOCX n'a pas de métadonnées standards facilement accessibles via mammoth
      // Ces champs pourront être enrichis avec d'autres bibliothèques si nécessaire
      pages: Math.ceil(textResult.value.length / 2500), // Approximation: ~2500 caractères par page
    }

    return {
      text: textResult.value,
      html: htmlResult.value,
      metadata,
      sections,
    }
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extrait les sections du texte DOCX
 * Détection basique basée sur les retours à la ligne et les paragraphes
 */
function extractSections(text: string): Array<{ level: number; title?: string; content: string }> {
  const sections: Array<{ level: number; title?: string; content: string }> = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  let currentSection: { level: number; title?: string; content: string } | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Détection simple d'un titre (ligne courte, peut-être en majuscules)
    if (trimmedLine.length < 100 && (trimmedLine === trimmedLine.toUpperCase() || /^\d+[\.\)]/.test(trimmedLine))) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        level: detectLevel(trimmedLine),
        title: trimmedLine,
        content: '',
      }
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine
    } else {
      // Première section sans titre
      currentSection = {
        level: 1,
        content: trimmedLine,
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

function detectLevel(line: string): number {
  // Détection du niveau basée sur la numérotation (1., 1.1, etc.)
  const match = line.match(/^(\d+)(\.\d+)*/)
  if (match) {
    return match[0].split('.').length
  }
  return 1
}

