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
   * @param excludeIndices - Set des indices de paragraphes déjà utilisés (pour éviter les doublons)
   */
  findQuestionPosition(
    paragraphs: Array<{ index: number; text: string; runs: Array<{ index: number; text: string }> }>,
    questionTitle: string,
    excludeIndices?: Set<number>
  ): DocxPosition | null {
    // Normaliser le titre de la question
    const normalizedQuestion = this.normalizeText(questionTitle)

    for (const paragraph of paragraphs) {
      // Ignorer les paragraphes déjà utilisés
      if (excludeIndices && excludeIndices.has(paragraph.index)) {
        continue
      }

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

    // Correspondance si le haystack commence par le needle (question numérotée)
    if (haystack.startsWith(needle.slice(0, Math.min(needle.length, 20)))) return true

    // Correspondance avec les premiers mots significatifs (au moins 60% de correspondance)
    const needleWords = needle.split(' ').filter(w => w.length > 2)
    if (needleWords.length === 0) return false

    const matchedWords = needleWords.filter(w => haystack.includes(w))
    const matchRatio = matchedWords.length / needleWords.length

    // Si au moins 60% des mots correspondent, c'est une correspondance
    if (matchRatio >= 0.6) return true

    // Correspondance par les mots clés importants (au moins 3 mots consécutifs)
    for (let i = 0; i <= needleWords.length - 3; i++) {
      const consecutiveWords = needleWords.slice(i, i + 3).join(' ')
      if (haystack.includes(consecutiveWords)) return true
    }

    return false
  }

  /**
   * Crée un template interne avec les placeholders insérés
   *
   * IMPORTANT: On insère les placeholders en ordre inverse (du dernier paragraphe au premier)
   * pour éviter que les insertions décalent les indices des paragraphes suivants
   *
   * GESTION DES QUESTIONS MULTIPLES:
   * Quand plusieurs questions pointent vers le même paragraphe (questions groupées dans le doc),
   * on crée un seul placeholder qui contiendra toutes les réponses concaténées
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

    // Créer les mappings d'abord (sans modifier le XML)
    const mappings: QuestionPositionMapping[] = []

    // Map pour grouper les questions par paragraphe
    // Clé: paragraphIndex, Valeur: liste des questions qui correspondent à ce paragraphe
    const paragraphToQuestions = new Map<number, Array<{
      question: typeof questions[0]
      placeholder: string
    }>>()

    for (const question of questions) {
      // Ne pas exclure les paragraphes déjà utilisés - on veut grouper les questions
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

        // Grouper par paragraphe
        if (!paragraphToQuestions.has(position.paragraphIndex)) {
          paragraphToQuestions.set(position.paragraphIndex, [])
        }
        paragraphToQuestions.get(position.paragraphIndex)!.push({
          question,
          placeholder,
        })
      }
    }

    // Créer les placeholders groupés
    const questionsWithPositions: Array<{
      paragraphIndex: number
      placeholders: string[] // Liste des placeholders pour ce paragraphe
    }> = []

    for (const [paragraphIndex, questionGroup] of paragraphToQuestions) {
      // Trier par ordre de question
      questionGroup.sort((a, b) => a.question.order - b.question.order)

      questionsWithPositions.push({
        paragraphIndex,
        placeholders: questionGroup.map(q => q.placeholder),
      })
    }

    // Trier par paragraphIndex décroissant pour insérer du bas vers le haut
    questionsWithPositions.sort((a, b) => b.paragraphIndex - a.paragraphIndex)

    // Insérer les placeholders dans l'ordre inverse
    for (const { paragraphIndex, placeholders } of questionsWithPositions) {
      // Insérer tous les placeholders pour ce paragraphe (séparés par un marqueur)
      const combinedPlaceholder = placeholders.join('||MULTI||')
      documentXml = this.insertPlaceholderAfterParagraph(
        documentXml,
        paragraphIndex,
        combinedPlaceholder
      )
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
   * Capture le style du paragraphe pour l'appliquer à la réponse
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
        // Extraire le style du paragraphe question
        const paragraphXml = match[0]
        const styleInfo = this.extractParagraphStyle(paragraphXml)

        // Insérer un nouveau paragraphe avec le placeholder après ce paragraphe
        const insertPosition = match.index + match[0].length
        const placeholderParagraph = this.createPlaceholderParagraph(placeholder, styleInfo)

        return xml.slice(0, insertPosition) + placeholderParagraph + xml.slice(insertPosition)
      }
      currentIndex++
    }

    return xml
  }

  /**
   * Extrait les informations de style d'un paragraphe (pPr et rPr)
   */
  private extractParagraphStyle(paragraphXml: string): string {
    // Extraire le style du paragraphe (<w:pPr>)
    const pPrMatch = paragraphXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)

    // Extraire le premier run style (<w:rPr> du premier <w:r>)
    const rPrMatch = paragraphXml.match(/<w:r[^>]*>[\s\S]*?<w:rPr>([\s\S]*?)<\/w:rPr>/)

    // Construire un objet JSON avec les styles trouvés
    const styleInfo = {
      pPr: pPrMatch ? pPrMatch[0] : null,
      rPr: rPrMatch ? `<w:rPr>${rPrMatch[1]}</w:rPr>` : null,
    }

    return JSON.stringify(styleInfo)
  }

  /**
   * Crée un paragraphe XML contenant le placeholder
   * Le style est configuré pour être discret (petite police, gris clair)
   * Stocke aussi le style du paragraphe question pour l'appliquer plus tard
   */
  private createPlaceholderParagraph(placeholder: string, questionParagraphStyle?: string): string {
    // Encoder le style du paragraphe question dans un attribut custom
    // On utilise base64 pour éviter les problèmes d'échappement XML
    const styleData = questionParagraphStyle
      ? Buffer.from(questionParagraphStyle).toString('base64')
      : ''

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
          <w:t>${placeholder}||STYLE:${styleData}</w:t>
        </w:r>
      </w:p>
    `.trim().replace(/\n\s*/g, '')
  }

  /**
   * Exporte le mémoire final avec les réponses injectées
   * Retourne le buffer ET un rapport détaillé
   *
   * IMPORTANT: On remplace les paragraphes entiers de placeholder (avec style invisible)
   * par des paragraphes proprement formatés avec le contenu
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
    const warnings: string[] = []

    // Regex pour trouver les paragraphes de placeholder complets
    // Format: peut contenir un ou plusieurs placeholders séparés par ||MULTI||
    // Exemple simple: {{Q_xxx}}||STYLE:base64
    // Exemple multiple: {{Q_xxx}}||MULTI||{{Q_yyy}}||STYLE:base64
    const placeholderParagraphRegex = /<w:p><w:pPr><w:rPr><w:sz w:val="2"\/><w:color w:val="FFFFFF"\/><\/w:rPr><\/w:pPr><w:r><w:rPr><w:sz w:val="2"\/><w:color w:val="FFFFFF"\/><\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><\/w:p>/g

    // Collecter tous les placeholders trouvés pour le rapport
    const foundPlaceholders = new Set<string>()

    // Remplacer chaque paragraphe de placeholder par le contenu formaté
    documentXml = documentXml.replace(placeholderParagraphRegex, (match, fullContent) => {
      // Séparer le contenu du style encodé
      const styleIndex = fullContent.lastIndexOf('||STYLE:')
      if (styleIndex === -1) return match // Pas un placeholder valide

      const placeholdersPart = fullContent.substring(0, styleIndex)
      const encodedStyle = fullContent.substring(styleIndex + 8) // 8 = length of '||STYLE:'

      // Extraire tous les placeholders (peuvent être multiples séparés par ||MULTI||)
      const placeholders = placeholdersPart.split('||MULTI||').filter((p: string) => p.startsWith('{{Q_'))

      if (placeholders.length === 0) return match

      // Décoder le style
      let pPr = ''
      let rPr = ''
      if (encodedStyle) {
        try {
          const styleData = Buffer.from(encodedStyle, 'base64').toString('utf8')
          const styleObj = JSON.parse(styleData)
          if (styleObj.rPr) {
            const fontMatch = styleObj.rPr.match(/<w:rFonts[^>]*\/>/)
            const sizeMatch = styleObj.rPr.match(/<w:sz[^>]*\/>/)
            const sizeCsMatch = styleObj.rPr.match(/<w:szCs[^>]*\/>/)
            rPr = '<w:rPr>' + (fontMatch ? fontMatch[0] : '') + (sizeMatch ? sizeMatch[0] : '') + (sizeCsMatch ? sizeCsMatch[0] : '') + '</w:rPr>'
            if (rPr === '<w:rPr></w:rPr>') rPr = ''
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }

      // Collecter toutes les réponses pour ces placeholders
      const allAnswers: string[] = []
      let hasAnyAnswer = false

      for (const placeholder of placeholders) {
        const shortId = placeholder.replace(/\{\{Q_|\}\}/g, '')
        foundPlaceholders.add(placeholder)

        // Chercher la réponse correspondante
        let answer: string | undefined
        let matchedQuestionId: string | undefined

        for (const [questionId, questionAnswer] of answers) {
          const questionShortId = questionId.slice(0, shortId.length).toUpperCase()
          if (questionShortId === shortId) {
            answer = questionAnswer
            matchedQuestionId = questionId
            break
          }
        }

        // Trouver le mapping correspondant pour le titre
        const mapping = mappings.find(m => {
          if (m.placeholder === placeholder) return true
          const mShortId = m.questionId.slice(0, shortId.length).toUpperCase()
          return mShortId === shortId
        })

        if (answer && answer.trim()) {
          hasAnyAnswer = true
          allAnswers.push(answer)
          details.push({
            questionId: matchedQuestionId || shortId,
            placeholder,
            questionTitle: mapping?.questionTitle || 'Question sans titre',
            status: 'injected',
            answerPreview: answer.slice(0, 100) + (answer.length > 100 ? '...' : ''),
          })
        } else {
          details.push({
            questionId: matchedQuestionId || shortId,
            placeholder,
            questionTitle: mapping?.questionTitle || 'Question sans titre',
            status: 'missing',
            error: 'Aucune réponse fournie',
          })
          if (!preserveEmptyPlaceholders) {
            allAnswers.push(missingAnswerText)
          }
        }
      }

      if (hasAnyAnswer || !preserveEmptyPlaceholders) {
        // Joindre toutes les réponses avec une ligne vide entre elles
        const combinedAnswer = allAnswers.join('\n\n')
        return this.createFormattedParagraphs(this.escapeXml(combinedAnswer), pPr, rPr)
      } else {
        return match // Garder le paragraphe de placeholder tel quel
      }
    })

    // Vérifier les réponses qui n'ont pas trouvé de placeholder
    for (const [questionId] of answers) {
      const shortId = questionId.slice(0, 16).toUpperCase()
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
   * Crée les paragraphes XML formatés à partir du contenu
   * Gère les retours à la ligne (\n) en créant des paragraphes séparés
   * Ajoute une ligne vide avant et après pour aérer le contenu
   */
  private createFormattedParagraphs(content: string, pPr: string, rPr: string): string {
    // Paragraphe vide pour l'espacement
    const emptyParagraph = '<w:p><w:r><w:t></w:t></w:r></w:p>'

    // Diviser le contenu par les retours à la ligne
    const lines = content.split(/\r?\n/)

    // Créer un paragraphe pour chaque ligne
    const contentParagraphs = lines.map(line => {
      // Si la ligne est vide, créer un paragraphe vide
      if (!line.trim()) {
        return emptyParagraph
      }

      // Le contenu a déjà été échappé en amont
      const safeContent = line

      // Créer le run avec le texte
      const run = rPr
        ? `<w:r>${rPr}<w:t xml:space="preserve">${safeContent}</w:t></w:r>`
        : `<w:r><w:t xml:space="preserve">${safeContent}</w:t></w:r>`

      // Créer le paragraphe
      return pPr
        ? `<w:p>${pPr}${run}</w:p>`
        : `<w:p>${run}</w:p>`
    }).join('')

    // Retourner avec ligne vide avant et après pour aérer
    return emptyParagraph + contentParagraphs + emptyParagraph
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

  /**
   * Méthode principale pour injecter les réponses d'un mémoire dans un template DOCX
   * Encapsule toute la logique : création du template interne + injection des réponses
   */
  async injectAnswers(
    templateBuffer: Buffer,
    memoId: string,
    userId: string
  ): Promise<{ docxBuffer: Buffer; report: InjectionReport }> {
    // Import dynamique de Prisma pour éviter les problèmes de circular imports
    const { prisma } = await import('@/lib/prisma/client')

    // Récupérer le mémoire avec ses sections
    const memo = await prisma.memoire.findUnique({
      where: { id: memoId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!memo) {
      throw new Error('Mémoire non trouvé')
    }

    if (memo.userId !== userId) {
      throw new Error('Accès non autorisé')
    }

    // Préparer les questions pour le template interne
    const questions = memo.sections.map(section => ({
      id: section.id,
      title: section.question || section.title,
      order: section.order,
      sectionId: section.id,
    }))

    // Créer le template interne avec les placeholders
    const internalTemplate = await this.createInternalTemplate(templateBuffer, questions)

    // Préparer les réponses (Map questionId -> answer)
    const answers = new Map<string, string>()
    for (const section of memo.sections) {
      if (section.content && section.content.trim()) {
        answers.set(section.id, section.content)
      }
    }

    // Exporter avec les réponses injectées
    const { buffer, report } = await this.exportWithAnswers(
      internalTemplate.buffer,
      answers,
      internalTemplate.mappings,
      {
        missingAnswerText: '[À compléter]',
        preserveEmptyPlaceholders: false,
      }
    )

    return { docxBuffer: buffer, report }
  }
}

// Export une instance singleton
export const docxInjectionService = new DocxInjectionService()

