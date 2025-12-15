/**
 * Service de parsing IA pour template mémoire
 * Utilise l'IA pour extraire intelligemment :
 * - Les sections/ITEMS (groupes de questions)
 * - Les questions individuelles (avec type OUI/NON détecté)
 * - Le formulaire entreprise en haut du document
 */

import { iaClient } from '@/ia/client'
import mammoth from 'mammoth'
import { parsePDF } from '@/lib/documents/parser/pdf-parser'

export interface ExtractedSection {
  id?: string
  order: number
  title: string
  required: boolean
  sourceAnchorJson?: {
    type: 'docx' | 'pdf'
    position?: number
    page?: number
    element?: string
  }
}

export interface ExtractedQuestion {
  id?: string
  sectionOrder?: number // Ordre de la section parente
  order: number // Ordre dans la section (ou global si pas de section)
  title: string
  questionType: 'TEXT' | 'YES_NO'
  required: boolean
  sourceAnchorJson?: {
    type: 'docx' | 'pdf'
    position?: number
    page?: number
    element?: string
  }
}

export interface ExtractedCompanyForm {
  fields: Array<{
    label: string
    type: 'text' | 'date' | 'select'
    required: boolean
    placeholder?: string
    options?: string[]
  }>
}

export interface ParsedTemplateResult {
  companyForm: ExtractedCompanyForm | null
  sections: ExtractedSection[]
  questions: ExtractedQuestion[]
}

/**
 * Parse un template DOCX avec IA
 */
export async function parseDOCXTemplateWithAI(
  buffer: Buffer,
  userId?: string,
  userEmail?: string,
  projectId?: string,
  documentId?: string
): Promise<ParsedTemplateResult> {
  try {
    const htmlResult = await mammoth.convertToHtml({ buffer })
    const text = extractTextFromHTML(htmlResult.value)
    
    return await parseTemplateWithAI(text, 'docx', userId, userEmail, projectId, documentId)
  } catch (error) {
    throw new Error(`Failed to parse DOCX template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse un template PDF avec IA
 */
export async function parsePDFTemplateWithAI(
  buffer: Buffer,
  userId?: string,
  userEmail?: string,
  projectId?: string,
  documentId?: string
): Promise<ParsedTemplateResult> {
  try {
    const parsedPDF = await parsePDF(buffer)
    const text = (parsedPDF as any).text || (parsedPDF as any).content || ''
    
    return await parseTemplateWithAI(text, 'pdf', userId, userEmail, projectId, documentId)
  } catch (error) {
    throw new Error(`Failed to parse PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse le template avec l'IA pour extraire la structure
 */
async function parseTemplateWithAI(
  text: string,
  sourceType: 'docx' | 'pdf',
  userId?: string,
  userEmail?: string,
  projectId?: string,
  documentId?: string
): Promise<ParsedTemplateResult> {
  // Limiter la taille du texte (premiers 20000 caractères)
  const textToAnalyze = text.length > 20000 ? text.substring(0, 20000) + '...' : text

  const prompt = `Tu es un expert en analyse de documents techniques (mémoires techniques d'appel d'offres BTP).

Analyse ce template de mémoire technique et extrait la structure suivante en JSON strict :

1. **FORMULAIRE ENTREPRISE** (début du document, avant les questions) :
   - Détecte les champs de formulaire liés à l'entreprise (ex: "Nom entreprise", "Rédacteur", "Date", etc.)
   - Retourne un objet avec un champ "fields" contenant un tableau de champs

2. **SECTIONS/ITEMS** (titres de groupes) :
   - Détecte les sections/ITEMS (ex: "ITEM 1: Moyens humains", "ITEM 2: Moyens matériels")
   - Chaque section est un titre/paragraphe qui regroupe plusieurs questions

3. **QUESTIONS** :
   - Extrait UNIQUEMENT les questions individuelles (pas les titres de sections)
   - Distingue :
     * Questions texte normales (ex: "Précisez les effectifs...")
     * Questions OUI/NON (ex: "Avez-vous un collaborateur dédié à la sécurité ?" avec checkboxes oui/non)
   - Chaque question doit être liée à sa section parente (via sectionOrder)

RÉPONSE ATTENDUE (JSON strict) :
{
  "companyForm": {
    "fields": [
      {"label": "Nom entreprise", "type": "text", "required": true},
      {"label": "Rédacteur (nom, qualité)", "type": "text", "required": false},
      {"label": "Date", "type": "date", "required": false}
    ]
  },
  "sections": [
    {"order": 1, "title": "ITEM 1: Moyens humains affectés au chantier", "required": true},
    {"order": 2, "title": "ITEM 2: Moyens matériels spécifiques", "required": true}
  ],
  "questions": [
    {"sectionOrder": 1, "order": 1, "title": "Précisez les effectifs précis qui seront affectés au chantier...", "questionType": "TEXT", "required": true},
    {"sectionOrder": 1, "order": 2, "title": "Avez-vous un collaborateur dédié à la sécurité ?", "questionType": "YES_NO", "required": true},
    {"sectionOrder": 2, "order": 1, "title": "Décrivez le mode d'approvisionnement du chantier :", "questionType": "TEXT", "required": true}
  ]
}

RÈGLES IMPORTANTES :
- Les ITEMs commencent généralement par "ITEM" ou sont en majuscules/bold
- Les questions se terminent souvent par "?", ":" ou contiennent "Précisez", "Décrivez", "Indiquez"
- Les questions OUI/NON contiennent "Avez-vous", "Votre entreprise dispense-t-elle", etc. ET ont des checkboxes oui/non visibles
- Ne retourne QUE les questions, pas les titres de sections
- Le formulaire entreprise est en haut du document (avant les ITEMs)

TEXTE À ANALYSER :
${textToAnalyze}

Réponds UNIQUEMENT avec le JSON, sans commentaires.`

  try {
    const response = await iaClient.generateResponse(
      {
        system: 'Tu es un expert en extraction structurée de documents techniques. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.',
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.1, // Basse température pour plus de cohérence
        maxTokens: 4000,
        tracking: userId
          ? {
              userId,
              userEmail,
              operation: 'template_parsing',
              projectId,
              documentId,
            }
          : undefined,
      }
    )

    // Parser le JSON de la réponse
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedTemplateResult

    // Validation et normalisation
    return {
      companyForm: parsed.companyForm || null,
      sections: (parsed.sections || []).map((s, idx) => ({
        order: s.order || idx + 1,
        title: s.title || '',
        required: s.required !== false,
      })),
      questions: (parsed.questions || []).map((q, idx) => ({
        sectionOrder: q.sectionOrder,
        order: q.order || idx + 1,
        title: q.title || '',
        questionType: (q.questionType === 'YES_NO' ? 'YES_NO' : 'TEXT') as 'TEXT' | 'YES_NO',
        required: q.required !== false,
      })),
    }
  } catch (error) {
    console.error('AI parsing error:', error)
    // Fallback : parsing simple sans IA
    return parseTemplateFallback(text, sourceType)
  }
}

/**
 * Fallback : parsing simple sans IA si l'IA échoue
 */
function parseTemplateFallback(text: string, sourceType: 'docx' | 'pdf'): ParsedTemplateResult {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  
  const sections: ExtractedSection[] = []
  const questions: ExtractedQuestion[] = []
  
  let sectionOrder = 0
  let questionOrder = 0
  let currentSectionOrder: number | undefined = undefined

  for (const line of lines) {
    // Détecter les ITEMs
    if (line.match(/^ITEM\s+\d+[:.]?\s+/i) || (line === line.toUpperCase() && line.length > 10 && line.length < 150)) {
      sectionOrder++
      sections.push({
        order: sectionOrder,
        title: line,
        required: true,
      })
      currentSectionOrder = sectionOrder
      questionOrder = 0
      continue
    }

    // Détecter les questions
    if (isQuestion(line)) {
      questionOrder++
      const isYesNo = /avez-vous|votre entreprise|dispense-t-elle|procédez-vous/i.test(line) && /\?/.test(line)
      
      questions.push({
        sectionOrder: currentSectionOrder,
        order: questionOrder,
        title: line.length > 200 ? line.substring(0, 200) + '...' : line,
        questionType: isYesNo ? 'YES_NO' : 'TEXT',
        required: true,
      })
    }
  }

  return {
    companyForm: null,
    sections,
    questions,
  }
}

/**
 * Vérifie si un texte est une question
 */
function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  
  // Finit par "?" ou ":"
  if (trimmed.endsWith('?') || trimmed.endsWith(':')) {
    return true
  }
  
  // Contient des mots-clés de question
  const questionKeywords = [
    'décrivez',
    'précisez',
    'indiquez',
    'expliquez',
    'comment',
    'quel',
    'quelle',
    'quels',
    'quelles',
    'avez-vous',
    'procédez-vous',
  ]
  
  const lowerText = trimmed.toLowerCase()
  return questionKeywords.some((keyword) => lowerText.includes(keyword))
}

/**
 * Extrait le texte brut depuis le HTML
 */
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ') // Remplacer les balises par des espaces
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

