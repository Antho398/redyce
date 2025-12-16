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
  parentQuestionOrder?: number // Ordre de la question parente (si c'est une sous-question)
  isGroupHeader?: boolean // Si true, c'est un titre de groupe qui ne demande pas de réponse directe
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

2. **SECTIONS/ITEMS/CHAPITRES** (titres de groupes principaux) :
   - Détecte les sections/ITEMS/CHAPITRES (ex: "ITEM 1: Moyens humains", "CHAPITRE 2: Moyens matériels", "Section 3: Organisation")
   - Peuvent commencer par "ITEM", "CHAPITRE", "SECTION", ou être des titres en majuscules/bold qui structurent le document
   - Chaque section est un titre/paragraphe qui regroupe plusieurs questions
   - Le système est générique : il fonctionne avec n'importe quel type de structure (items, chapitres, sections, etc.)

3. **QUESTIONS** :
   - Extrait TOUTES les questions individuelles et points de complétion (pas les titres de sections)
   - DÉTECTION DES QUESTIONS OUI/NON :
     * Une question OUI/NON contient "Avez-vous", "Votre entreprise dispense-t-elle", "Procédez-vous", etc. ET a des checkboxes oui/non visibles dans le document
     * Si une question commence par "Si oui", "Si, oui", "Si non", etc., c'est une SOUS-QUESTION conditionnelle liée à la question OUI/NON précédente
     * Les sous-questions conditionnelles doivent avoir "parentQuestionOrder" défini avec l'ordre de la question OUI/NON parente
   - DÉTECTION DES QUESTIONS AVEC SOUS-QUESTIONS :
     * Certaines questions servent de "titre" pour regrouper des sous-questions (ex: "Délais :" suivi de "Intervention urgente :" et "Intervention normale :")
     * Si dans le document, il y a une INDENTATION visuelle (les sous-questions sont indentées sous la question principale), alors :
       - La question principale (ex: "Délais :") est une QUESTION NORMALE (pas isGroupHeader), avec son propre order
       - Les sous-questions indentées (ex: "Intervention urgente :", "Intervention normale :") ont "parentQuestionOrder" défini avec l'order de la question principale
       - Les orders doivent être SÉQUENTIELS (1, 2, 3, 4...) sans saut, même si certaines sont des sous-questions
     * Exemple : Si "Délais :" est à l'order 2, "Intervention urgente :" est à l'order 3 avec parentQuestionOrder: 2, "Intervention normale :" est à l'order 4 avec parentQuestionOrder: 2
     * Ne jamais utiliser isGroupHeader pour ce cas : la question principale demande une réponse et regroupe des sous-questions via l'indentation
   - Inclut :
     * Questions texte normales (ex: "Précisez les effectifs...")
     * Questions OUI/NON (ex: "Avez-vous un collaborateur dédié à la sécurité ?")
     * Sous-questions conditionnelles des questions OUI/NON (ex: "Si oui, précisez sa place dans l'organigramme :")
     * Points de complétion génériques (ex: "Autres précisions", "Fournir la fiches des principaux matériaux :", "Listes des pièces jointes :")
     * Questions avec sous-questions indentées (ex: "Délais :" → "Intervention urgente :", "Intervention normale :")
   - Chaque question doit être liée à sa section parente (via sectionOrder)
   - Les sous-questions doivent être liées à leur question parente (via parentQuestionOrder)

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
    {"sectionOrder": 1, "order": 2, "title": "Autres précisions :", "questionType": "TEXT", "required": false},
    {"sectionOrder": 3, "order": 1, "title": "Avez-vous un collaborateur dédié à la sécurité ?", "questionType": "YES_NO", "required": true},
    {"sectionOrder": 3, "order": 2, "title": "Si, oui précisez sa place dans l'organigramme :", "questionType": "TEXT", "required": false, "parentQuestionOrder": 1},
    {"sectionOrder": 3, "order": 3, "title": "Votre entreprise dispense-t-elle des formations ou des actions de sensibilisation ?", "questionType": "YES_NO", "required": true},
    {"sectionOrder": 3, "order": 4, "title": "Si oui, précisez :", "questionType": "TEXT", "required": false, "parentQuestionOrder": 3},
    {"sectionOrder": 2, "order": 1, "title": "Décrivez le mode d'approvisionnement du chantier :", "questionType": "TEXT", "required": true},
    {"sectionOrder": 4, "order": 1, "title": "Fournir la fiches des principaux matériaux :", "questionType": "TEXT", "required": true},
    {"sectionOrder": 6, "order": 1, "title": "Précisez l'organisation de la prise en charge des dysfonctionnements...", "questionType": "TEXT", "required": true},
    {"sectionOrder": 6, "order": 2, "title": "Délais :", "questionType": "TEXT", "required": false},
    {"sectionOrder": 6, "order": 3, "title": "Intervention urgente :", "questionType": "TEXT", "required": false, "parentQuestionOrder": 2},
    {"sectionOrder": 6, "order": 4, "title": "Intervention normale :", "questionType": "TEXT", "required": false, "parentQuestionOrder": 2},
    {"sectionOrder": 6, "order": 5, "title": "Listes des pièces jointes :", "questionType": "TEXT", "required": false}
  ]
}

RÈGLES IMPORTANTES :
- Les ITEMs commencent généralement par "ITEM" ou sont en majuscules/bold
- Les questions se terminent souvent par "?", ":" ou contiennent "Précisez", "Décrivez", "Indiquez", "Fournir", "Liste", "Autres"
- QUESTIONS OUI/NON :
  * Détecte les questions qui contiennent "Avez-vous", "Votre entreprise dispense-t-elle", "Procédez-vous", etc. ET ont des checkboxes oui/non visibles
  * Marque-les avec "questionType": "YES_NO"
  * Les sous-questions qui commencent par "Si oui", "Si, oui", "Si non" sont des sous-questions conditionnelles : utilise "parentQuestionOrder" avec l'ordre de la question OUI/NON parente
- QUESTIONS AVEC SOUS-QUESTIONS INDENTÉES :
  * Si un libellé comme "Délais :" est suivi de plusieurs sous-questions indentées (ex: "Intervention urgente :", "Intervention normale :"), alors :
    - "Délais :" est une QUESTION NORMALE (pas isGroupHeader), avec son propre order séquentiel
    - Les sous-questions indentées ont "parentQuestionOrder" défini avec l'order de "Délais :"
    - La numérotation doit être SÉQUENTIELLE (1, 2, 3, 4...) sans saut, même si certaines sont des sous-questions
- Les points de complétion incluent :
  * "Autres précisions" (généralement à la fin d'une section)
  * "Fournir la/les fiches..." (demandes de documents)
  * "Liste(s) des pièces jointes" (demandes de listes)
- Ne retourne QUE les questions et points de complétion, pas les titres de sections
- Le formulaire entreprise est en haut du document (avant les ITEMs)
- SOIS EXHAUSTIF : Si un élément demande une information, une précision, une liste ou un document, considère-le comme une question à extraire
- ANALYSE LA STRUCTURE : Identifie les relations parent-enfant entre les questions (questions OUI/NON → sous-questions conditionnelles, questions avec indentation → sous-questions indentées)

TEXTE À ANALYSER :
${textToAnalyze}

Réponds UNIQUEMENT avec le JSON, sans commentaires.`

  try {
    const parsed = await iaClient.generateJSONResponse<ParsedTemplateResult>(
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
        parentQuestionOrder: q.parentQuestionOrder || null,
        isGroupHeader: false, // Plus utilisé : toutes les questions sont normales, les groupes sont gérés via parentQuestionOrder
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
    'fournir',
    'fournissez',
    'liste',
    'listes',
    'autres précisions',
    'intervention',
    'délais',
    'pièces jointes',
    'autocontrôles',
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

