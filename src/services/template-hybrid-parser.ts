/**
 * Service de parsing hybride pour templates DOCX
 * 
 * Combine :
 * 1. Détection structurelle (styles Word, numérotation, XML)
 * 2. Parsing IA (pour enrichissement sémantique)
 * 
 * Produit un mapping fiable question ↔ position
 */

import { docxQuestionDetector, DetectedQuestion, DetectedSection, DetectionStats } from './docx-question-detector'
import { parseDOCXTemplateWithAI, ParsedTemplateResult } from './memory-template-parser-ai'

export interface HybridParsingResult {
  // Questions détectées structurellement
  structuralQuestions: DetectedQuestion[]
  // Sections détectées
  sections: DetectedSection[]
  // Résultat du parsing IA (enrichissement)
  aiResult?: ParsedTemplateResult
  // Mapping fusionné (structural + AI)
  mergedQuestions: MergedQuestion[]
  // Statistiques de détection
  stats: HybridParsingStats
}

export interface MergedQuestion {
  // ID stable de la question
  questionId: string
  // Texte de la question
  text: string
  // Position dans le document
  position: {
    paragraphIndex: number
    tableInfo?: {
      tableIndex: number
      rowIndex: number
      cellIndex: number
    }
  }
  // Section parente
  sectionTitle?: string
  sectionOrder?: number
  // Ordre dans la section
  order: number
  // Type de question
  questionType: 'TEXT' | 'YES_NO'
  // Question parente (pour sous-questions)
  parentQuestionId?: string
  parentQuestionOrder?: number
  // Niveau hiérarchique
  level: number
  // Source de détection
  source: 'structural' | 'ai' | 'merged'
  // Score de confiance
  confidence: number
  // Obligatoire
  required: boolean
}

export interface HybridParsingStats extends DetectionStats {
  // Statistiques de fusion
  structuralOnly: number
  aiOnly: number
  merged: number
  aiMatchRate: number
}

/**
 * Parse un template DOCX avec une approche hybride
 */
export async function parseTemplateHybrid(
  buffer: Buffer,
  options: {
    userId?: string
    userEmail?: string
    projectId?: string
    documentId?: string
    useAI?: boolean
  } = {}
): Promise<HybridParsingResult> {
  const { useAI = true, userId, userEmail, projectId, documentId } = options

  // 1. Détection structurelle (toujours effectuée)
  const { questions: structuralQuestions, sections, stats: structuralStats } = 
    await docxQuestionDetector.detectQuestions(buffer)

  // 2. Parsing IA (optionnel, pour enrichissement)
  let aiResult: ParsedTemplateResult | undefined
  if (useAI) {
    try {
      aiResult = await parseDOCXTemplateWithAI(buffer, userId, userEmail, projectId, documentId)
    } catch (error) {
      console.warn('AI parsing failed, using structural detection only:', error)
    }
  }

  // 3. Fusionner les résultats
  const mergedQuestions = mergeResults(structuralQuestions, sections, aiResult)

  // 4. Calculer les statistiques
  const stats = calculateHybridStats(structuralQuestions, aiResult, mergedQuestions, structuralStats)

  return {
    structuralQuestions,
    sections,
    aiResult,
    mergedQuestions,
    stats,
  }
}

/**
 * Fusionne les résultats structurels et IA
 */
function mergeResults(
  structuralQuestions: DetectedQuestion[],
  sections: DetectedSection[],
  aiResult?: ParsedTemplateResult
): MergedQuestion[] {
  const merged: MergedQuestion[] = []
  const usedAiQuestions = new Set<number>()

  // Créer un mapping des sections par ordre
  const sectionsByOrder = new Map<number, DetectedSection>()
  sections.forEach((s, idx) => sectionsByOrder.set(idx + 1, s))

  // D'abord, traiter les questions structurelles
  let globalOrder = 0
  for (const sq of structuralQuestions) {
    globalOrder++
    
    // Chercher une correspondance IA
    let aiMatch: ParsedTemplateResult['questions'][0] | undefined
    let matchScore = 0

    if (aiResult) {
      for (let i = 0; i < aiResult.questions.length; i++) {
        if (usedAiQuestions.has(i)) continue
        
        const aiQ = aiResult.questions[i]
        const score = calculateMatchScore(sq.text, aiQ.title)
        
        if (score > matchScore && score > 0.6) {
          aiMatch = aiQ
          matchScore = score
          usedAiQuestions.add(i)
        }
      }
    }

    // Trouver la section parente
    const parentSection = sq.parentSection || findNearestSection(sq, sections)

    merged.push({
      questionId: sq.questionId,
      text: sq.text,
      position: {
        paragraphIndex: sq.position.paragraphIndex,
        tableInfo: sq.position.tableInfo,
      },
      sectionTitle: parentSection?.title,
      sectionOrder: parentSection ? sections.indexOf(parentSection) + 1 : undefined,
      order: globalOrder,
      questionType: aiMatch?.questionType === 'YES_NO' ? 'YES_NO' : detectQuestionType(sq.text),
      parentQuestionId: sq.parentQuestionId,
      parentQuestionOrder: aiMatch?.parentQuestionOrder,
      level: sq.level,
      source: aiMatch ? 'merged' : 'structural',
      confidence: aiMatch ? Math.max(sq.confidence, 0.9) : sq.confidence,
      required: aiMatch?.required ?? sq.level === 1,
    })
  }

  // Ajouter les questions IA non matchées (avec confiance réduite)
  if (aiResult) {
    for (let i = 0; i < aiResult.questions.length; i++) {
      if (usedAiQuestions.has(i)) continue
      
      const aiQ = aiResult.questions[i]
      globalOrder++

      // Trouver la section correspondante
      const sectionOrder = aiQ.sectionOrder
      const section = sectionOrder ? sectionsByOrder.get(sectionOrder) : undefined

      merged.push({
        questionId: generateAiQuestionId(aiQ.title, i),
        text: aiQ.title,
        position: {
          paragraphIndex: -1, // Position inconnue
        },
        sectionTitle: section?.title || aiResult.sections?.find(s => s.order === sectionOrder)?.title,
        sectionOrder,
        order: globalOrder,
        questionType: aiQ.questionType,
        parentQuestionOrder: aiQ.parentQuestionOrder,
        level: aiQ.parentQuestionOrder ? 2 : 1,
        source: 'ai',
        confidence: 0.7, // Confiance réduite car pas de validation structurelle
        required: aiQ.required,
      })
    }
  }

  // Trier par section puis par ordre
  merged.sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder) {
      return (a.sectionOrder || 999) - (b.sectionOrder || 999)
    }
    return a.order - b.order
  })

  // Réindexer les ordres
  let currentSection: number | undefined
  let orderInSection = 0
  for (const q of merged) {
    if (q.sectionOrder !== currentSection) {
      currentSection = q.sectionOrder
      orderInSection = 0
    }
    orderInSection++
    q.order = orderInSection
  }

  return merged
}

/**
 * Calcule le score de correspondance entre deux textes
 */
function calculateMatchScore(text1: string, text2: string): number {
  const normalized1 = normalizeForMatching(text1)
  const normalized2 = normalizeForMatching(text2)

  // Correspondance exacte
  if (normalized1 === normalized2) return 1

  // Correspondance par inclusion
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9
  }

  // Correspondance par mots communs
  const words1 = new Set(normalized1.split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(normalized2.split(/\s+/).filter(w => w.length > 2))
  
  if (words1.size === 0 || words2.size === 0) return 0

  let commonWords = 0
  for (const word of words1) {
    if (words2.has(word)) commonWords++
  }

  return commonWords / Math.max(words1.size, words2.size)
}

/**
 * Normalise le texte pour le matching
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wàâäéèêëïîôùûüç\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Détecte le type de question (OUI/NON ou TEXTE)
 */
function detectQuestionType(text: string): 'TEXT' | 'YES_NO' {
  const yesNoPatterns = [
    /avez-vous/i,
    /disposez-vous/i,
    /pouvez-vous/i,
    /votre entreprise.*-t-elle/i,
    /est-ce que/i,
    /y a-t-il/i,
    /procédez-vous/i,
    /acceptez-vous/i,
    /êtes-vous/i,
  ]

  return yesNoPatterns.some(p => p.test(text)) ? 'YES_NO' : 'TEXT'
}

/**
 * Trouve la section la plus proche d'une question
 */
function findNearestSection(
  question: DetectedQuestion,
  sections: DetectedSection[]
): DetectedSection | undefined {
  let nearestSection: DetectedSection | undefined
  let minDistance = Infinity

  for (const section of sections) {
    const distance = question.position.paragraphIndex - section.position.paragraphIndex
    if (distance > 0 && distance < minDistance) {
      minDistance = distance
      nearestSection = section
    }
  }

  return nearestSection
}

/**
 * Génère un ID stable pour une question IA
 */
function generateAiQuestionId(text: string, index: number): string {
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha256')
    .update(`ai:${index}:${text.toLowerCase()}`)
    .digest('hex')
    .slice(0, 12)
  
  return `ai_${hash}`
}

/**
 * Calcule les statistiques hybrides
 */
function calculateHybridStats(
  structuralQuestions: DetectedQuestion[],
  aiResult: ParsedTemplateResult | undefined,
  mergedQuestions: MergedQuestion[],
  structuralStats: DetectionStats
): HybridParsingStats {
  const structuralOnly = mergedQuestions.filter(q => q.source === 'structural').length
  const aiOnly = mergedQuestions.filter(q => q.source === 'ai').length
  const merged = mergedQuestions.filter(q => q.source === 'merged').length

  const aiQuestionCount = aiResult?.questions?.length || 0
  const aiMatchRate = aiQuestionCount > 0 
    ? (aiQuestionCount - aiOnly) / aiQuestionCount 
    : 0

  return {
    ...structuralStats,
    totalQuestions: mergedQuestions.length,
    mainQuestions: mergedQuestions.filter(q => q.level === 1).length,
    subQuestions: mergedQuestions.filter(q => q.level === 2).length,
    structuralOnly,
    aiOnly,
    merged,
    aiMatchRate,
  }
}

/**
 * Convertit le résultat hybride au format attendu par le service de template
 */
export function convertToTemplateFormat(result: HybridParsingResult): ParsedTemplateResult {
  return {
    companyForm: result.aiResult?.companyForm || null,
    sections: result.sections.map((s, idx) => ({
      order: idx + 1,
      title: s.title,
      required: true,
    })),
    questions: result.mergedQuestions.map(q => ({
      sectionOrder: q.sectionOrder || 1,
      order: q.order,
      title: q.text,
      questionType: q.questionType,
      required: q.required,
      parentQuestionOrder: q.parentQuestionOrder || null,
      isGroupHeader: false,
    })),
  }
}

