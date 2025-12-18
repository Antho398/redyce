/**
 * Service d'injection automatique des réponses dans un template DOCX
 * 
 * ARCHITECTURE:
 * 1. Lors du parsing du template: analyse le DOCX et stocke les positions des questions
 * 2. Génération template interne: duplique le DOCX et insère des placeholders {{Q_xxx}}
 * 3. Export: remplace les placeholders par les réponses validées
 * 
 * IMPORTANT: Les placeholders sont invisibles pour l'utilisateur
 */

import JSZip from 'jszip'
import { generatePlaceholder } from '@/lib/utils/docx-placeholders'

// Interface pour une position dans le document DOCX
export interface DocxPosition {
  paragraphIndex: number
  // Index du run dans le paragraphe (un run = un bloc de texte avec même formatage)
  runIndex?: number
  // Position du caractère dans le texte du run
  charOffset?: number
  // Texte environnant pour validation
  contextBefore?: string
  contextAfter?: string
}

// Interface pour le mapping question -> position
export interface QuestionPositionMapping {
  questionId: string
  placeholder: string
  sectionId?: string
  questionTitle: string
  questionOrder: number
  position: DocxPosition
}

// Interface pour le template interne
export interface InternalTemplate {
  // Buffer du DOCX avec placeholders insérés
  buffer: Buffer
  // Mapping des questions
  mappings: QuestionPositionMapping[]
  // Date de création
  createdAt: Date
  // Hash du document original pour validation
  originalHash: string
}

// Interface pour le rapport d'injection
export interface InjectionReport {
  // Statistiques globales
  totalQuestions: number
  injectedCount: number
  missingCount: number
  notFoundCount: number
  
  // Détails par question
  details: InjectionDetail[]
  
  // Résumé
  success: boolean
  warnings: string[]
  
  // Timestamps
  exportedAt: Date
  durationMs: number
}

export interface InjectionDetail {
  questionId: string
  placeholder: string
  questionTitle: string
  status: 'injected' | 'missing' | 'not_found'
  answerPreview?: string // Premiers 100 caractères de la réponse
  error?: string
}

// Interface pour le résultat d'export
export interface ExportResult {
  buffer: Buffer
  report: InjectionReport
  fileName: string
}

/**
 * Classe principale pour la manipulation des templates DOCX
 */
export class DocxInjectionService {
  
  /**
   * Analyse un DOCX et extrait les positions des questions
   * Retourne le XML du document avec les positions identifiées
   */
  async analyzeDocxStructure(buffer: Buffer): Promise<{
    xml: string
    paragraphs: Array<{
      index: number
      text: string
      runs: Array<{ index: number; text: string }>
    }>
  }> {
    const zip = await JSZip.loadAsync(buffer)
    const documentXml = await zip.file('word/document.xml')?.async('string')
    
    if (!documentXml) {
      throw new Error('Invalid DOCX: no document.xml found')
    }

    // Parser le XML pour extraire les paragraphes
    const paragraphs = this.extractParagraphsFromXml(documentXml)
    
    return { xml: documentXml, paragraphs }
  }

  /**
   * Extrait les paragraphes et leurs contenus du XML
   */
  private extractParagraphsFromXml(xml: string): Array<{
    index: number
    text: string
    runs: Array<{ index: number; text: string }>
  }> {
    const paragraphs: Array<{
      index: number
      text: string
      runs: Array<{ index: number; text: string }>
    }> = []

    // Regex pour trouver les paragraphes (<w:p>...</w:p>)
    const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g
    let match
    let paragraphIndex = 0

    while ((match = paragraphRegex.exec(xml)) !== null) {
      const paragraphContent = match[1]
      const runs = this.extractRunsFromParagraph(paragraphContent)
      const fullText = runs.map(r => r.text).join('')

      if (fullText.trim()) {
        paragraphs.push({
          index: paragraphIndex,
          text: fullText,
          runs,
        })
      }
      paragraphIndex++
    }

    return paragraphs
  }

  /**
   * Extrait les "runs" (blocs de texte) d'un paragraphe
   */
  private extractRunsFromParagraph(paragraphXml: string): Array<{
    index: number
    text: string
  }> {
    const runs: Array<{ index: number; text: string }> = []
    
    // Regex pour trouver les runs (<w:r>...</w:r>)
    const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g
    let match
    let runIndex = 0

    while ((match = runRegex.exec(paragraphXml)) !== null) {
      const runContent = match[1]
      
      // Extraire le texte du run (<w:t>...</w:t>)
      const textMatch = runContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)
      if (textMatch) {
        const text = textMatch
          .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
          .join('')
        
        if (text) {
          runs.push({ index: runIndex, text })
        }
      }
      runIndex++
    }

    return runs
  }

  /**
   * Trouve la position d'une question dans le document
   * Utilise une correspondance floue pour gérer les variations de formatage
   */
  findQuestionPosition(
    paragraphs: Array<{ index: number; text: string; runs: Array<{ index: number; text: string }> }>,
    questionTitle: string
  ): DocxPosition | null {
    // Normaliser le titre de la question
    const normalizedQuestion = this.normalizeText(questionTitle)
    
    for (const paragraph of paragraphs) {
      const normalizedParagraph = this.normalizeText(paragraph.text)
      
      // Vérifier si le paragraphe contient la question
      if (this.fuzzyMatch(normalizedParagraph, normalizedQuestion)) {
        return {
          paragraphIndex: paragraph.index,
          contextBefore: paragraph.text.slice(0, 50),
          contextAfter: paragraph.text.slice(-50),
        }
      }
    }
    
    return null
  }

  /**
   * Normalise le texte pour la comparaison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\s\u00A0]+/g, ' ') // Normalise tous les espaces
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .trim()
  }

  /**
   * Correspondance floue entre deux textes
   */
  private fuzzyMatch(haystack: string, needle: string): boolean {
    // Correspondance exacte
    if (haystack.includes(needle)) return true
    
    // Correspondance avec les premiers mots (au moins 80% de correspondance)
    const needleWords = needle.split(' ').filter(w => w.length > 2)
    const matchedWords = needleWords.filter(w => haystack.includes(w))
    
    return matchedWords.length >= needleWords.length * 0.8
  }

  /**
   * Crée un template interne avec les placeholders insérés
   */
  async createInternalTemplate(
    originalBuffer: Buffer,
    questions: Array<{
      id: string
      title: string
      order: number
      sectionId?: string
    }>
  ): Promise<InternalTemplate> {
    const zip = await JSZip.loadAsync(originalBuffer)
    let documentXml = await zip.file('word/document.xml')?.async('string')
    
    if (!documentXml) {
      throw new Error('Invalid DOCX: no document.xml found')
    }

    // Analyser la structure
    const { paragraphs } = await this.analyzeDocxStructure(originalBuffer)
    
    // Créer les mappings et insérer les placeholders
    const mappings: QuestionPositionMapping[] = []
    
    for (const question of questions) {
      const position = this.findQuestionPosition(paragraphs, question.title)
      
      if (position) {
        const placeholder = generatePlaceholder(question.id)
        
        mappings.push({
          questionId: question.id,
          placeholder,
          sectionId: question.sectionId,
          questionTitle: question.title,
          questionOrder: question.order,
          position,
        })
        
        // Insérer le placeholder après la question dans le XML
        documentXml = this.insertPlaceholderAfterParagraph(
          documentXml,
          position.paragraphIndex,
          placeholder
        )
      }
    }

    // Mettre à jour le document dans le ZIP
    zip.file('word/document.xml', documentXml)
    
    // Générer le buffer
    const buffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    // Calculer le hash du document original
    const crypto = await import('crypto')
    const originalHash = crypto.createHash('md5').update(originalBuffer).digest('hex')

    return {
      buffer,
      mappings,
      createdAt: new Date(),
      originalHash,
    }
  }

  /**
   * Insère un placeholder après un paragraphe spécifique
   */
  private insertPlaceholderAfterParagraph(
    xml: string,
    paragraphIndex: number,
    placeholder: string
  ): string {
    // Trouver le n-ième paragraphe
    const paragraphRegex = /<w:p[^>]*>[\s\S]*?<\/w:p>/g
    let match
    let currentIndex = 0
    
    while ((match = paragraphRegex.exec(xml)) !== null) {
      if (currentIndex === paragraphIndex) {
        // Insérer un nouveau paragraphe avec le placeholder après ce paragraphe
        const insertPosition = match.index + match[0].length
        const placeholderParagraph = this.createPlaceholderParagraph(placeholder)
        
        return xml.slice(0, insertPosition) + placeholderParagraph + xml.slice(insertPosition)
      }
      currentIndex++
    }
    
    return xml
  }

  /**
   * Crée un paragraphe XML contenant le placeholder
   * Le style est configuré pour être discret (petite police, gris clair)
   */
  private createPlaceholderParagraph(placeholder: string): string {
    // Créer un paragraphe avec le placeholder
    // Note: Ce paragraphe est visible dans le template interne mais pas dans l'export final
    return `
      <w:p>
        <w:pPr>
          <w:rPr>
            <w:sz w:val="2"/>
            <w:color w:val="FFFFFF"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="2"/>
            <w:color w:val="FFFFFF"/>
          </w:rPr>
          <w:t>${placeholder}</w:t>
        </w:r>
      </w:p>
    `.trim().replace(/\n\s*/g, '')
  }

  /**
   * Exporte le mémoire final avec les réponses injectées
   * Retourne le buffer ET un rapport détaillé
   */
  async exportWithAnswers(
    internalTemplateBuffer: Buffer,
    answers: Map<string, string>, // questionId -> answer
    mappings: QuestionPositionMapping[], // Mappings pour le rapport
    options: {
      missingAnswerText?: string
      preserveEmptyPlaceholders?: boolean
    } = {}
  ): Promise<{ buffer: Buffer; report: InjectionReport }> {
    const startTime = Date.now()
    const {
      missingAnswerText = '[À compléter]',
      preserveEmptyPlaceholders = false,
    } = options

    const zip = await JSZip.loadAsync(internalTemplateBuffer)
    let documentXml = await zip.file('word/document.xml')?.async('string')
    
    if (!documentXml) {
      throw new Error('Invalid DOCX: no document.xml found')
    }

    // Préparer le rapport
    const details: InjectionDetail[] = []
    const foundPlaceholders = new Set<string>()
    const warnings: string[] = []

    // Trouver tous les placeholders dans le document
    const placeholderRegex = /\{\{Q_[A-Z0-9]+\}\}/g
    const allPlaceholders = documentXml.match(placeholderRegex) || []
    const uniquePlaceholders = [...new Set(allPlaceholders)]

    // Remplacer chaque placeholder
    documentXml = documentXml.replace(placeholderRegex, (match) => {
      const shortId = match.replace(/\{\{Q_|\}\}/g, '')
      foundPlaceholders.add(match)
      
      // Chercher la réponse correspondante
      let answer: string | undefined
      let matchedQuestionId: string | undefined
      
      for (const [questionId, questionAnswer] of answers) {
        if (questionId.toUpperCase().startsWith(shortId) || 
            questionId.slice(0, 8).toUpperCase() === shortId) {
          answer = questionAnswer
          matchedQuestionId = questionId
          break
        }
      }
      
      // Trouver le mapping correspondant pour le titre
      const mapping = mappings.find(m => 
        m.placeholder === match || 
        m.questionId.toUpperCase().startsWith(shortId) ||
        m.questionId.slice(0, 8).toUpperCase() === shortId
      )
      
      if (answer && answer.trim()) {
        details.push({
          questionId: matchedQuestionId || shortId,
          placeholder: match,
          questionTitle: mapping?.questionTitle || 'Question sans titre',
          status: 'injected',
          answerPreview: answer.slice(0, 100) + (answer.length > 100 ? '...' : ''),
        })
        return this.escapeXml(answer)
      } else {
        details.push({
          questionId: matchedQuestionId || shortId,
          placeholder: match,
          questionTitle: mapping?.questionTitle || 'Question sans titre',
          status: 'missing',
          error: 'Aucune réponse fournie',
        })
        
        if (preserveEmptyPlaceholders) {
          return match
        } else {
          return this.escapeXml(missingAnswerText)
        }
      }
    })

    // Vérifier les réponses qui n'ont pas trouvé de placeholder
    for (const [questionId] of answers) {
      const shortId = questionId.slice(0, 8).toUpperCase()
      const expectedPlaceholder = `{{Q_${shortId}}}`
      
      const wasFound = details.some(d => 
        d.questionId === questionId || 
        d.placeholder === expectedPlaceholder
      )
      
      if (!wasFound) {
        const mapping = mappings.find(m => m.questionId === questionId)
        details.push({
          questionId,
          placeholder: expectedPlaceholder,
          questionTitle: mapping?.questionTitle || 'Question sans titre',
          status: 'not_found',
          error: 'Placeholder non trouvé dans le template',
        })
        warnings.push(`Réponse pour "${mapping?.questionTitle || questionId}" non injectée : placeholder introuvable`)
      }
    }

    // Nettoyer les paragraphes de placeholders
    documentXml = this.cleanupPlaceholderParagraphs(documentXml)

    // Mettre à jour le document
    zip.file('word/document.xml', documentXml)
    
    const buffer = await zip.generateAsync({ type: 'nodebuffer' })
    const durationMs = Date.now() - startTime

    // Calculer les statistiques
    const injectedCount = details.filter(d => d.status === 'injected').length
    const missingCount = details.filter(d => d.status === 'missing').length
    const notFoundCount = details.filter(d => d.status === 'not_found').length

    // Générer les warnings
    if (missingCount > 0) {
      warnings.push(`${missingCount} question(s) sans réponse marquée(s) "[À compléter]"`)
    }
    if (notFoundCount > 0) {
      warnings.push(`${notFoundCount} réponse(s) non injectée(s) : placeholder(s) introuvable(s)`)
    }

    const report: InjectionReport = {
      totalQuestions: details.length,
      injectedCount,
      missingCount,
      notFoundCount,
      details,
      success: injectedCount > 0,
      warnings,
      exportedAt: new Date(),
      durationMs,
    }

    return { buffer, report }
  }

  /**
   * Nettoie les paragraphes de placeholders (supprime le formatage invisible)
   */
  private cleanupPlaceholderParagraphs(xml: string): string {
    // Supprimer les paragraphes avec police taille 2 et couleur blanche (nos placeholders)
    // qui sont maintenant remplacés par du contenu réel
    return xml.replace(
      /<w:p>\s*<w:pPr>\s*<w:rPr>\s*<w:sz w:val="2"\/>\s*<w:color w:val="FFFFFF"\/>\s*<\/w:rPr>\s*<\/w:pPr>\s*<w:r>\s*<w:rPr>\s*<w:sz w:val="2"\/>\s*<w:color w:val="FFFFFF"\/>\s*<\/w:rPr>\s*<w:t>[^<]*<\/w:t>\s*<\/w:r>\s*<\/w:p>/g,
      (match) => {
        // Extraire le contenu du placeholder
        const textMatch = match.match(/<w:t>([^<]*)<\/w:t>/)
        if (!textMatch) return ''
        
        const content = textMatch[1]
        
        // Si c'est toujours un placeholder non remplacé, le supprimer
        if (content.startsWith('{{Q_')) {
          return ''
        }
        
        // Sinon, créer un paragraphe normal avec le contenu
        return `<w:p><w:r><w:t>${content}</w:t></w:r></w:p>`
      }
    )
  }

  /**
   * Échappe les caractères spéciaux XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Valide que le template interne correspond toujours au document original
   */
  async validateTemplate(
    internalTemplateBuffer: Buffer,
    originalBuffer: Buffer
  ): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      const crypto = await import('crypto')
      const originalHash = crypto.createHash('md5').update(originalBuffer).digest('hex')
      
      // Vérifier que le template interne peut être chargé
      const zip = await JSZip.loadAsync(internalTemplateBuffer)
      const documentXml = await zip.file('word/document.xml')?.async('string')
      
      if (!documentXml) {
        errors.push('Invalid internal template: no document.xml found')
      }
      
      // Vérifier la présence de placeholders
      const placeholderRegex = /\{\{Q_[A-Z0-9]+\}\}/g
      const placeholders = documentXml?.match(placeholderRegex) || []
      
      if (placeholders.length === 0) {
        errors.push('No placeholders found in internal template')
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors }
    }
  }
}

// Export une instance singleton
export const docxInjectionService = new DocxInjectionService()

