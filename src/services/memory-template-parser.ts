/**
 * Service de parsing de template mémoire
 * Extrait les sections depuis DOCX/PDF selon la stratégie V1
 */

import mammoth from 'mammoth'
import { parsePDF } from '@/lib/documents/parser/pdf-parser'
import { fileStorage } from '@/lib/documents/storage'

export interface ExtractedSection {
  order: number
  title: string
  path?: string
  required: boolean
  sourceAnchorJson?: {
    type: 'docx' | 'pdf'
    position?: number
    page?: number
    element?: string
  }
}

/**
 * Parse un template DOCX et extrait les sections
 */
export async function parseDOCXTemplate(buffer: Buffer): Promise<ExtractedSection[]> {
  try {
    // Extraire le HTML avec mammoth
    const htmlResult = await mammoth.convertToHtml({ buffer })

    // Parser le HTML pour extraire les sections
    const sections = extractSectionsFromHTML(htmlResult.value)

    return sections
  } catch (error) {
    throw new Error(`Failed to parse DOCX template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse un template PDF et extrait les sections
 */
export async function parsePDFTemplate(buffer: Buffer): Promise<ExtractedSection[]> {
  try {
    const parsedPDF = await parsePDF(buffer)
    // Le parser PDF retourne un objet avec un champ text ou content
    const text = (parsedPDF as any).text || (parsedPDF as any).content || ''

    // Extraire les sections depuis le texte PDF
    const sections = extractSectionsFromPDFText(text)

    return sections
  } catch (error) {
    throw new Error(`Failed to parse PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extrait les sections depuis le HTML DOCX
 * Stratégie: titres (h1/h2/h3) OU paragraphes qui ressemblent à des questions
 */
function extractSectionsFromHTML(html: string): ExtractedSection[] {
  const sections: ExtractedSection[] = []
  let order = 1

  // Parser le HTML avec une regex simple (ou utiliser cheerio si besoin)
  // On cherche:
  // 1. Les balises de titre: <h1>, <h2>, <h3>
  // 2. Les paragraphes avec questions: finissant par "?" ou contenant des mots-clés

  // Regex pour extraire les titres
  const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi
  const headings: Array<{ text: string; tag: string; index: number }> = []
  
  let match
  while ((match = headingRegex.exec(html)) !== null) {
    const tag = match[0].match(/<h([1-3])/)?.[1] || '1'
    const text = cleanHTML(match[1])
    if (text.trim()) {
      headings.push({
        text,
        tag,
        index: match.index || 0,
      })
    }
  }

  // Si on a des titres, les utiliser
  if (headings.length > 0) {
    headings.forEach((heading, idx) => {
      sections.push({
        order: order++,
        title: heading.text,
        path: generatePath(headings, idx),
        required: true,
        sourceAnchorJson: {
          type: 'docx',
          position: heading.index,
          element: `h${heading.tag}`,
        },
      })
    })
  } else {
    // Sinon, chercher les paragraphes avec questions
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi
    while ((match = paragraphRegex.exec(html)) !== null) {
      const text = cleanHTML(match[1])
      
      // Vérifier si c'est une question
      if (isQuestion(text)) {
        sections.push({
          order: order++,
          title: text.length > 100 ? text.substring(0, 100) + '...' : text,
          required: true,
          sourceAnchorJson: {
            type: 'docx',
            position: match.index || 0,
            element: 'p',
          },
        })
      }
    }
  }

  // Si toujours rien, utiliser les paragraphes principaux
  if (sections.length === 0) {
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi
    let paraCount = 0
    while ((match = paragraphRegex.exec(html)) !== null && paraCount < 20) {
      const text = cleanHTML(match[1])
      if (text.trim().length > 20) {
        sections.push({
          order: order++,
          title: text.length > 100 ? text.substring(0, 100) + '...' : text,
          required: true,
          sourceAnchorJson: {
            type: 'docx',
            position: match.index || 0,
            element: 'p',
          },
        })
        paraCount++
      }
    }
  }

  return sections
}

/**
 * Extrait les sections depuis le texte PDF
 * Stratégie: lignes en MAJUSCULES, numérotées (1., 1.1., A.), ou questions "?"
 */
function extractSectionsFromPDFText(text: string): ExtractedSection[] {
  const sections: ExtractedSection[] = []
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  
  let order = 1
  let currentPath: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Détecter les sections numérotées (1., 1.1., A., etc.)
    const numberedMatch = line.match(/^(\d+\.(?:\d+\.)*|[A-Z]\.)\s+(.+)$/)
    if (numberedMatch) {
      const number = numberedMatch[1]
      const title = numberedMatch[2]
      
      // Mettre à jour le path
      currentPath = number.split('.').filter(Boolean)
      
      sections.push({
        order: order++,
        title: title.trim(),
        path: currentPath.join('.'),
        required: true,
        sourceAnchorJson: {
          type: 'pdf',
          position: i,
        },
      })
      continue
    }

    // Détecter les lignes en MAJUSCULES (titres probables)
    if (line === line.toUpperCase() && line.length > 5 && line.length < 200 && !line.includes('  ')) {
      sections.push({
        order: order++,
        title: line,
        path: currentPath.length > 0 ? currentPath.join('.') + '.' + order : undefined,
        required: true,
        sourceAnchorJson: {
          type: 'pdf',
          position: i,
        },
      })
      continue
    }

    // Détecter les questions
    if (isQuestion(line)) {
      sections.push({
        order: order++,
        title: line.length > 150 ? line.substring(0, 150) + '...' : line,
        path: currentPath.length > 0 ? currentPath.join('.') + '.' + order : undefined,
        required: true,
        sourceAnchorJson: {
          type: 'pdf',
          position: i,
        },
      })
    }
  }

  return sections
}

/**
 * Génère un chemin hiérarchique depuis les titres
 */
function generatePath(headings: Array<{ tag: string }>, currentIndex: number): string {
  const levels: number[] = []
  
  for (let i = 0; i <= currentIndex; i++) {
    const level = parseInt(headings[i].tag)
    
    // Réinitialiser les niveaux inférieurs
    while (levels.length >= level) {
      levels.pop()
    }
    
    // Ajouter le niveau actuel
    if (levels.length < level) {
      const lastValue = levels[levels.length - 1] || 0
      levels.push(lastValue + 1)
    } else {
      levels[level - 1] = (levels[level - 1] || 0) + 1
    }
  }
  
  return levels.join('.')
}

/**
 * Vérifie si un texte est une question
 */
function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  
  // Finit par "?"
  if (trimmed.endsWith('?')) {
    return true
  }
  
  // Contient des mots-clés de question
  const questionKeywords = [
    'décrivez',
    'précisez',
    'indiquez',
    'expliquez',
    'préciser',
    'décrire',
    'indiquer',
    'expliquer',
    'comment',
    'quel',
    'quelle',
    'quels',
    'quelles',
  ]
  
  const lowerText = trimmed.toLowerCase()
  return questionKeywords.some((keyword) => lowerText.includes(keyword))
}

/**
 * Nettoie le HTML pour extraire le texte
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Enlever les balises
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

