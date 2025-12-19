/**
 * Service de détection fiable des questions dans un template DOCX
 * 
 * ORDRE DE PRIORITÉ DE DÉTECTION :
 * 1. Styles Word (Heading 1-6, styles personnalisés)
 * 2. Numérotation (1., 1.1, a), b), etc.)
 * 3. Heuristiques texte (?, mots-clés d'introduction)
 * 
 * CARACTÉRISTIQUES :
 * - Détection déterministe et reproductible
 * - Gestion des tableaux, multi-lignes, sous-questions
 * - Évite les faux positifs
 */

import JSZip from 'jszip'
import crypto from 'crypto'

// ============================================================================
// INTERFACES
// ============================================================================

export interface DetectedQuestion {
  // Identifiant stable (hash du contenu + position)
  questionId: string
  // Texte brut de la question
  text: string
  // Texte normalisé pour le matching
  normalizedText: string
  // Position dans le document
  position: QuestionPosition
  // Section parente (si détectée)
  parentSection?: DetectedSection
  // Question parente (pour sous-questions)
  parentQuestionId?: string
  // Niveau hiérarchique (1 = principal, 2 = sous-question)
  level: number
  // Type de détection utilisé
  detectionMethod: DetectionMethod
  // Score de confiance (0-1)
  confidence: number
  // Métadonnées de style
  styleInfo?: StyleInfo
  // Numérotation détectée
  numbering?: NumberingInfo
}

export interface DetectedSection {
  sectionId: string
  title: string
  level: number
  position: QuestionPosition
}

export interface QuestionPosition {
  // Index du paragraphe dans le document
  paragraphIndex: number
  // Index du run dans le paragraphe
  runIndex?: number
  // Position dans un tableau (si applicable)
  tableInfo?: {
    tableIndex: number
    rowIndex: number
    cellIndex: number
  }
  // Contexte pour validation
  contextBefore: string
  contextAfter: string
}

export interface StyleInfo {
  styleName: string
  styleId: string
  isHeading: boolean
  headingLevel?: number
  isBold: boolean
  isItalic: boolean
  fontSize?: number
}

export interface NumberingInfo {
  // Format de numérotation (decimal, lowerLetter, upperLetter, lowerRoman)
  format: string
  // Valeur de la numérotation
  value: string
  // Niveau dans la liste
  level: number
  // ID de la définition de numérotation
  numId?: string
}

export type DetectionMethod = 
  | 'style_heading'      // Détecté via style Heading
  | 'style_custom'       // Détecté via style personnalisé
  | 'numbering_decimal'  // Détecté via numérotation décimale
  | 'numbering_letter'   // Détecté via numérotation alphabétique
  | 'heuristic_question' // Détecté via "?"
  | 'heuristic_keyword'  // Détecté via mots-clés
  | 'table_cell'         // Détecté dans un tableau

// ============================================================================
// CONSTANTES
// ============================================================================

// Mots-clés d'introduction de question (insensible à la casse)
const QUESTION_KEYWORDS = [
  'décrire', 'décrivez', 'description',
  'préciser', 'précisez', 'précision',
  'indiquer', 'indiquez', 
  'expliquer', 'expliquez', 'explication',
  'détailler', 'détaillez',
  'présenter', 'présentez', 'présentation',
  'fournir', 'fournissez',
  'lister', 'listez', 'liste',
  'mentionner', 'mentionnez',
  'joindre', 'joignez',
  'justifier', 'justifiez',
  'démontrer', 'démontrez',
  'proposer', 'proposez',
  'définir', 'définissez',
  'identifier', 'identifiez',
  'énumérer', 'énumérez',
  'spécifier', 'spécifiez',
  'comment', 'quels', 'quelles', 'quel', 'quelle',
  'combien', 'pourquoi',
]

// Patterns de numérotation
const NUMBERING_PATTERNS = {
  // 1., 2., 3., etc.
  decimal: /^(\d+)\.\s*/,
  // 1.1, 1.2, 2.1.3, etc.
  decimalMulti: /^(\d+(?:\.\d+)+)\s*/,
  // a), b), c) ou a., b., c.
  lowerLetter: /^([a-z])[.)]\s*/i,
  // A), B), C) ou A., B., C.
  upperLetter: /^([A-Z])[.)]\s*/,
  // i), ii), iii) ou i., ii., iii.
  lowerRoman: /^(i{1,3}|iv|v|vi{0,3}|ix|x)[.)]\s*/i,
  // (1), (2), (3)
  decimalParen: /^\((\d+)\)\s*/,
  // (a), (b), (c)
  letterParen: /^\(([a-z])\)\s*/i,
  // - ou • (puces)
  bullet: /^[-•●○◦]\s*/,
}

// Styles Word typiques pour les questions
const QUESTION_STYLE_PATTERNS = [
  /question/i,
  /item/i,
  /point/i,
  /rubrique/i,
  /critère/i,
]

// Styles à exclure (pas des questions)
const EXCLUDED_STYLE_PATTERNS = [
  /title/i,
  /header/i,
  /footer/i,
  /toc/i,  // Table of contents
  /caption/i,
]

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class DocxQuestionDetector {
  private xml: string = ''
  private stylesXml: string = ''
  private numberingXml: string = ''
  private paragraphs: ParsedParagraph[] = []
  private tables: ParsedTable[] = []
  private styleDefinitions: Map<string, StyleDefinition> = new Map()
  private numberingDefinitions: Map<string, NumberingDefinition> = new Map()

  /**
   * Détecte toutes les questions dans un document DOCX
   */
  async detectQuestions(buffer: Buffer): Promise<{
    questions: DetectedQuestion[]
    sections: DetectedSection[]
    stats: DetectionStats
  }> {
    // Charger et parser le document
    await this.loadDocument(buffer)
    
    // Parser les définitions de styles et numérotation
    this.parseStyleDefinitions()
    this.parseNumberingDefinitions()
    
    // Extraire les paragraphes avec leurs métadonnées
    this.parseParagraphs()
    this.parseTables()
    
    // Détecter les sections
    const sections = this.detectSections()
    
    // Détecter les questions
    const questions = this.detectAllQuestions(sections)
    
    // Calculer les statistiques
    const stats = this.calculateStats(questions)
    
    return { questions, sections, stats }
  }

  /**
   * Charge le document DOCX
   */
  private async loadDocument(buffer: Buffer): Promise<void> {
    const zip = await JSZip.loadAsync(buffer)
    
    // Document principal
    const documentXmlFile = zip.file('word/document.xml')
    if (!documentXmlFile) {
      throw new Error('Invalid DOCX: no document.xml found')
    }
    this.xml = await documentXmlFile.async('string')
    
    // Styles (optionnel)
    const stylesXmlFile = zip.file('word/styles.xml')
    if (stylesXmlFile) {
      this.stylesXml = await stylesXmlFile.async('string')
    }
    
    // Numérotation (optionnel)
    const numberingXmlFile = zip.file('word/numbering.xml')
    if (numberingXmlFile) {
      this.numberingXml = await numberingXmlFile.async('string')
    }
  }

  /**
   * Parse les définitions de styles
   */
  private parseStyleDefinitions(): void {
    if (!this.stylesXml) return
    
    // Regex pour extraire les styles
    const styleRegex = /<w:style[^>]*w:styleId="([^"]*)"[^>]*>([\s\S]*?)<\/w:style>/g
    let match
    
    while ((match = styleRegex.exec(this.stylesXml)) !== null) {
      const styleId = match[1]
      const styleContent = match[2]
      
      // Extraire le nom du style
      const nameMatch = styleContent.match(/<w:name w:val="([^"]*)"/);
      const name = nameMatch ? nameMatch[1] : styleId
      
      // Détecter si c'est un heading
      const outlineLevelMatch = styleContent.match(/<w:outlineLvl w:val="(\d+)"/)
      const isHeading = outlineLevelMatch !== null || /heading/i.test(name)
      const headingLevel = outlineLevelMatch ? parseInt(outlineLevelMatch[1]) + 1 : undefined
      
      this.styleDefinitions.set(styleId, {
        styleId,
        name,
        isHeading,
        headingLevel,
        isQuestion: QUESTION_STYLE_PATTERNS.some(p => p.test(name)),
        isExcluded: EXCLUDED_STYLE_PATTERNS.some(p => p.test(name)),
      })
    }
  }

  /**
   * Parse les définitions de numérotation
   */
  private parseNumberingDefinitions(): void {
    if (!this.numberingXml) return
    
    // Regex pour extraire les numéros abstraits
    const abstractNumRegex = /<w:abstractNum[^>]*w:abstractNumId="([^"]*)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g
    let match
    
    while ((match = abstractNumRegex.exec(this.numberingXml)) !== null) {
      const numId = match[1]
      const numContent = match[2]
      
      // Extraire le format de numérotation
      const formatMatch = numContent.match(/<w:numFmt w:val="([^"]*)"/);
      const format = formatMatch ? formatMatch[1] : 'decimal'
      
      this.numberingDefinitions.set(numId, {
        numId,
        format,
      })
    }
  }

  /**
   * Parse tous les paragraphes du document
   */
  private parseParagraphs(): void {
    const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g
    let match
    let index = 0
    
    while ((match = paragraphRegex.exec(this.xml)) !== null) {
      const paragraphXml = match[0]
      const paragraphContent = match[1]
      
      // Extraire les propriétés du paragraphe
      const pPrMatch = paragraphContent.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)
      const properties = pPrMatch ? pPrMatch[1] : ''
      
      // Extraire le style
      const styleMatch = properties.match(/<w:pStyle w:val="([^"]*)"/)
      const styleId = styleMatch ? styleMatch[1] : undefined
      
      // Extraire la numérotation
      const numPrMatch = properties.match(/<w:numPr>([\s\S]*?)<\/w:numPr>/)
      let numbering: NumberingInfo | undefined
      if (numPrMatch) {
        const numIdMatch = numPrMatch[1].match(/<w:numId w:val="([^"]*)"/)
        const ilvlMatch = numPrMatch[1].match(/<w:ilvl w:val="([^"]*)"/)
        if (numIdMatch) {
          numbering = {
            format: 'decimal',
            value: '',
            level: ilvlMatch ? parseInt(ilvlMatch[1]) : 0,
            numId: numIdMatch[1],
          }
        }
      }
      
      // Extraire le texte et les runs
      const runs = this.extractRuns(paragraphContent)
      const text = runs.map(r => r.text).join('')
      
      if (text.trim()) {
        this.paragraphs.push({
          index,
          xml: paragraphXml,
          text,
          normalizedText: this.normalizeText(text),
          runs,
          styleId,
          numbering,
          style: styleId ? this.styleDefinitions.get(styleId) : undefined,
        })
      }
      
      index++
    }
  }

  /**
   * Extrait les runs d'un paragraphe
   */
  private extractRuns(paragraphXml: string): ParsedRun[] {
    const runs: ParsedRun[] = []
    const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g
    let match
    let runIndex = 0
    
    while ((match = runRegex.exec(paragraphXml)) !== null) {
      const runContent = match[1]
      
      // Extraire le texte
      const textMatches = runContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
      if (textMatches) {
        const text = textMatches
          .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
          .join('')
        
        // Extraire les propriétés du run
        const rPrMatch = runContent.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)
        const isBold = rPrMatch ? /<w:b[^\/]*\/>/.test(rPrMatch[1]) : false
        const isItalic = rPrMatch ? /<w:i[^\/]*\/>/.test(rPrMatch[1]) : false
        
        runs.push({
          index: runIndex,
          text,
          isBold,
          isItalic,
        })
      }
      runIndex++
    }
    
    return runs
  }

  /**
   * Parse les tableaux du document
   */
  private parseTables(): void {
    const tableRegex = /<w:tbl>([\s\S]*?)<\/w:tbl>/g
    let match
    let tableIndex = 0
    
    while ((match = tableRegex.exec(this.xml)) !== null) {
      const tableContent = match[1]
      const rows: ParsedTableRow[] = []
      
      // Extraire les lignes
      const rowRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g
      let rowMatch
      let rowIndex = 0
      
      while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
        const rowContent = rowMatch[1]
        const cells: ParsedTableCell[] = []
        
        // Extraire les cellules
        const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g
        let cellMatch
        let cellIndex = 0
        
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          const cellContent = cellMatch[1]
          
          // Extraire le texte de la cellule
          const textMatches = cellContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
          const text = textMatches
            ? textMatches.map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join('')
            : ''
          
          cells.push({
            index: cellIndex,
            text,
            normalizedText: this.normalizeText(text),
          })
          cellIndex++
        }
        
        rows.push({ index: rowIndex, cells })
        rowIndex++
      }
      
      this.tables.push({ index: tableIndex, rows })
      tableIndex++
    }
  }

  /**
   * Détecte les sections (titres de niveau supérieur)
   */
  private detectSections(): DetectedSection[] {
    const sections: DetectedSection[] = []
    
    for (const paragraph of this.paragraphs) {
      // Détecter via style Heading
      if (paragraph.style?.isHeading && paragraph.style.headingLevel && paragraph.style.headingLevel <= 3) {
        sections.push({
          sectionId: this.generateStableId(paragraph.text, paragraph.index, 'section'),
          title: paragraph.text.trim(),
          level: paragraph.style.headingLevel,
          position: {
            paragraphIndex: paragraph.index,
            contextBefore: '',
            contextAfter: this.getContextAfter(paragraph.index),
          },
        })
        continue
      }
      
      // Détecter via patterns de section (ITEM, CHAPITRE, etc.)
      const sectionPatterns = [
        /^ITEM\s*\d+/i,
        /^CHAPITRE\s*\d+/i,
        /^SECTION\s*\d+/i,
        /^PARTIE\s*\d+/i,
        /^ARTICLE\s*\d+/i,
      ]
      
      for (const pattern of sectionPatterns) {
        if (pattern.test(paragraph.text.trim())) {
          sections.push({
            sectionId: this.generateStableId(paragraph.text, paragraph.index, 'section'),
            title: paragraph.text.trim(),
            level: 1,
            position: {
              paragraphIndex: paragraph.index,
              contextBefore: '',
              contextAfter: this.getContextAfter(paragraph.index),
            },
          })
          break
        }
      }
    }
    
    return sections
  }

  /**
   * Détecte toutes les questions
   */
  private detectAllQuestions(sections: DetectedSection[]): DetectedQuestion[] {
    const questions: DetectedQuestion[] = []
    let currentSection: DetectedSection | undefined
    let lastMainQuestion: DetectedQuestion | undefined
    
    for (const paragraph of this.paragraphs) {
      // Mettre à jour la section courante
      const section = sections.find(s => s.position.paragraphIndex === paragraph.index)
      if (section) {
        currentSection = section
        continue // Les sections ne sont pas des questions
      }
      
      // Skip les paragraphes exclus
      if (paragraph.style?.isExcluded) continue
      
      // Détecter la question
      const detection = this.detectQuestion(paragraph, currentSection, lastMainQuestion)
      
      if (detection) {
        questions.push(detection)
        
        // Mettre à jour la dernière question principale
        if (detection.level === 1) {
          lastMainQuestion = detection
        }
      }
    }
    
    // Détecter les questions dans les tableaux
    const tableQuestions = this.detectQuestionsInTables(sections)
    questions.push(...tableQuestions)
    
    // Trier par position
    questions.sort((a, b) => a.position.paragraphIndex - b.position.paragraphIndex)
    
    return questions
  }

  /**
   * Détecte si un paragraphe est une question
   */
  private detectQuestion(
    paragraph: ParsedParagraph,
    currentSection?: DetectedSection,
    lastMainQuestion?: DetectedQuestion
  ): DetectedQuestion | null {
    const text = paragraph.text.trim()
    
    // Ignorer les paragraphes trop courts
    if (text.length < 5) return null
    
    // 1. Détection via style personnalisé "question"
    if (paragraph.style?.isQuestion) {
      return this.createQuestion(
        paragraph,
        'style_custom',
        0.95,
        currentSection,
        undefined,
        1
      )
    }
    
    // 2. Détection via numérotation
    const numberingDetection = this.detectByNumbering(paragraph, lastMainQuestion)
    if (numberingDetection) {
      return this.createQuestion(
        paragraph,
        numberingDetection.method,
        numberingDetection.confidence,
        currentSection,
        numberingDetection.parentId,
        numberingDetection.level,
        numberingDetection.numbering
      )
    }
    
    // 3. Détection via heuristiques texte
    const heuristicDetection = this.detectByHeuristics(paragraph)
    if (heuristicDetection) {
      return this.createQuestion(
        paragraph,
        heuristicDetection.method,
        heuristicDetection.confidence,
        currentSection,
        lastMainQuestion?.questionId,
        heuristicDetection.isSubQuestion ? 2 : 1
      )
    }
    
    return null
  }

  /**
   * Détection par numérotation
   */
  private detectByNumbering(
    paragraph: ParsedParagraph,
    lastMainQuestion?: DetectedQuestion
  ): {
    method: DetectionMethod
    confidence: number
    level: number
    parentId?: string
    numbering: NumberingInfo
  } | null {
    const text = paragraph.text.trim()
    
    // Vérifier la numérotation Word native
    if (paragraph.numbering) {
      const isSubQuestion = paragraph.numbering.level > 0
      return {
        method: 'numbering_decimal',
        confidence: 0.9,
        level: isSubQuestion ? 2 : 1,
        parentId: isSubQuestion ? lastMainQuestion?.questionId : undefined,
        numbering: paragraph.numbering,
      }
    }
    
    // Détecter la numérotation dans le texte
    for (const [type, pattern] of Object.entries(NUMBERING_PATTERNS)) {
      const match = text.match(pattern)
      if (match) {
        const value = match[1] || ''
        const isSubQuestion = type.includes('letter') || type.includes('bullet')
        
        // Vérifier que c'est bien une question (pas juste une liste)
        const restOfText = text.slice(match[0].length)
        if (!this.looksLikeQuestion(restOfText)) {
          continue
        }
        
        return {
          method: type.includes('letter') ? 'numbering_letter' : 'numbering_decimal',
          confidence: 0.85,
          level: isSubQuestion ? 2 : 1,
          parentId: isSubQuestion ? lastMainQuestion?.questionId : undefined,
          numbering: {
            format: type,
            value,
            level: isSubQuestion ? 1 : 0,
          },
        }
      }
    }
    
    return null
  }

  /**
   * Détection par heuristiques texte
   */
  private detectByHeuristics(paragraph: ParsedParagraph): {
    method: DetectionMethod
    confidence: number
    isSubQuestion: boolean
  } | null {
    const text = paragraph.text.trim()
    const normalizedText = paragraph.normalizedText
    
    // Détection par point d'interrogation
    if (text.endsWith('?')) {
      // Éviter les faux positifs (phrases trop courtes, sans verbe)
      const wordCount = text.split(/\s+/).length
      if (wordCount >= 3) {
        return {
          method: 'heuristic_question',
          confidence: 0.9,
          isSubQuestion: false,
        }
      }
    }
    
    // Détection par deux-points en fin
    if (text.endsWith(':')) {
      // Vérifier qu'il y a un mot-clé d'introduction
      const hasKeyword = QUESTION_KEYWORDS.some(kw => 
        normalizedText.includes(kw.toLowerCase())
      )
      if (hasKeyword) {
        return {
          method: 'heuristic_keyword',
          confidence: 0.85,
          isSubQuestion: false,
        }
      }
    }
    
    // Détection par mots-clés d'introduction en début de phrase
    const firstWord = normalizedText.split(/\s+/)[0]
    if (QUESTION_KEYWORDS.includes(firstWord)) {
      return {
        method: 'heuristic_keyword',
        confidence: 0.8,
        isSubQuestion: false,
      }
    }
    
    // Détection par patterns spécifiques aux mémoires techniques
    const memoirePatterns = [
      /^\s*si\s+oui\s*[,:]/i,        // "Si oui, ..."
      /^\s*si\s+non\s*[,:]/i,        // "Si non, ..."
      /^\s*dans\s+le\s+cas\s+où/i,   // "Dans le cas où..."
      /^\s*le\s+cas\s+échéant/i,     // "Le cas échéant..."
      /^\s*autres?\s+précisions?/i,  // "Autres précisions"
      /^\s*pièces?\s+jointes?/i,     // "Pièces jointes"
      /^\s*documents?\s+à\s+fournir/i, // "Documents à fournir"
    ]
    
    for (const pattern of memoirePatterns) {
      if (pattern.test(text)) {
        return {
          method: 'heuristic_keyword',
          confidence: 0.85,
          isSubQuestion: /^\s*si\s+(oui|non)/i.test(text),
        }
      }
    }
    
    return null
  }

  /**
   * Vérifie si un texte ressemble à une question
   */
  private looksLikeQuestion(text: string): boolean {
    const normalized = this.normalizeText(text)
    
    // Vérifie les terminaisons
    if (text.trim().endsWith('?') || text.trim().endsWith(':')) {
      return true
    }
    
    // Vérifie les mots-clés
    return QUESTION_KEYWORDS.some(kw => normalized.includes(kw.toLowerCase()))
  }

  /**
   * Détecte les questions dans les tableaux
   */
  private detectQuestionsInTables(sections: DetectedSection[]): DetectedQuestion[] {
    const questions: DetectedQuestion[] = []
    
    for (const table of this.tables) {
      // Analyser la structure du tableau
      const firstRow = table.rows[0]
      if (!firstRow) continue
      
      // Détecter si c'est un tableau de questions
      // (généralement 2 colonnes : question | réponse)
      const isQuestionTable = firstRow.cells.length >= 2 && 
        firstRow.cells.some(c => 
          /question|intitul|crit/i.test(c.text) ||
          this.looksLikeQuestion(c.text)
        )
      
      if (!isQuestionTable) continue
      
      // Parcourir les lignes (en sautant l'en-tête si détecté)
      const startRow = /question|intitul|crit/i.test(firstRow.cells[0]?.text || '') ? 1 : 0
      
      for (let rowIdx = startRow; rowIdx < table.rows.length; rowIdx++) {
        const row = table.rows[rowIdx]
        const questionCell = row.cells[0]
        
        if (!questionCell || !questionCell.text.trim()) continue
        
        // Vérifier que c'est bien une question
        if (!this.looksLikeQuestion(questionCell.text)) continue
        
        // Créer un ID stable basé sur la position dans le tableau
        const questionId = this.generateStableId(
          questionCell.text,
          table.index * 10000 + rowIdx,
          'table'
        )
        
        questions.push({
          questionId,
          text: questionCell.text.trim(),
          normalizedText: questionCell.normalizedText,
          position: {
            paragraphIndex: -1, // Pas un paragraphe
            tableInfo: {
              tableIndex: table.index,
              rowIndex: rowIdx,
              cellIndex: 0,
            },
            contextBefore: this.getTableContext(table, rowIdx, -1),
            contextAfter: this.getTableContext(table, rowIdx, 1),
          },
          level: 1,
          detectionMethod: 'table_cell',
          confidence: 0.85,
        })
      }
    }
    
    return questions
  }

  /**
   * Crée un objet question
   */
  private createQuestion(
    paragraph: ParsedParagraph,
    method: DetectionMethod,
    confidence: number,
    section?: DetectedSection,
    parentQuestionId?: string,
    level: number = 1,
    numbering?: NumberingInfo
  ): DetectedQuestion {
    const questionId = this.generateStableId(paragraph.text, paragraph.index, 'question')
    
    return {
      questionId,
      text: paragraph.text.trim(),
      normalizedText: paragraph.normalizedText,
      position: {
        paragraphIndex: paragraph.index,
        contextBefore: this.getContextBefore(paragraph.index),
        contextAfter: this.getContextAfter(paragraph.index),
      },
      parentSection: section,
      parentQuestionId,
      level,
      detectionMethod: method,
      confidence,
      styleInfo: paragraph.style ? {
        styleName: paragraph.style.name,
        styleId: paragraph.style.styleId,
        isHeading: paragraph.style.isHeading,
        headingLevel: paragraph.style.headingLevel,
        isBold: paragraph.runs.some(r => r.isBold),
        isItalic: paragraph.runs.some(r => r.isItalic),
      } : undefined,
      numbering,
    }
  }

  /**
   * Génère un ID stable basé sur le contenu et la position
   */
  private generateStableId(text: string, position: number, prefix: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${prefix}:${position}:${text.trim().toLowerCase()}`)
      .digest('hex')
      .slice(0, 12)
    
    return `${prefix}_${hash}`
  }

  /**
   * Normalise le texte pour le matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\s\u00A0]+/g, ' ')
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[–—]/g, '-')
      .trim()
  }

  /**
   * Obtient le contexte avant un paragraphe
   */
  private getContextBefore(paragraphIndex: number): string {
    const prevParagraph = this.paragraphs.find(p => p.index === paragraphIndex - 1)
    return prevParagraph?.text.slice(-50) || ''
  }

  /**
   * Obtient le contexte après un paragraphe
   */
  private getContextAfter(paragraphIndex: number): string {
    const nextParagraph = this.paragraphs.find(p => p.index === paragraphIndex + 1)
    return nextParagraph?.text.slice(0, 50) || ''
  }

  /**
   * Obtient le contexte d'une ligne de tableau
   */
  private getTableContext(table: ParsedTable, rowIndex: number, direction: -1 | 1): string {
    const targetRow = table.rows[rowIndex + direction]
    if (!targetRow) return ''
    return targetRow.cells.map(c => c.text).join(' | ').slice(0, 50)
  }

  /**
   * Calcule les statistiques de détection
   */
  private calculateStats(questions: DetectedQuestion[]): DetectionStats {
    const byMethod: Record<DetectionMethod, number> = {
      style_heading: 0,
      style_custom: 0,
      numbering_decimal: 0,
      numbering_letter: 0,
      heuristic_question: 0,
      heuristic_keyword: 0,
      table_cell: 0,
    }
    
    let totalConfidence = 0
    
    for (const q of questions) {
      byMethod[q.detectionMethod]++
      totalConfidence += q.confidence
    }
    
    return {
      totalQuestions: questions.length,
      mainQuestions: questions.filter(q => q.level === 1).length,
      subQuestions: questions.filter(q => q.level === 2).length,
      averageConfidence: questions.length > 0 ? totalConfidence / questions.length : 0,
      byMethod,
    }
  }
}

// ============================================================================
// INTERFACES INTERNES
// ============================================================================

interface ParsedParagraph {
  index: number
  xml: string
  text: string
  normalizedText: string
  runs: ParsedRun[]
  styleId?: string
  numbering?: NumberingInfo
  style?: StyleDefinition
}

interface ParsedRun {
  index: number
  text: string
  isBold: boolean
  isItalic: boolean
}

interface ParsedTable {
  index: number
  rows: ParsedTableRow[]
}

interface ParsedTableRow {
  index: number
  cells: ParsedTableCell[]
}

interface ParsedTableCell {
  index: number
  text: string
  normalizedText: string
}

interface StyleDefinition {
  styleId: string
  name: string
  isHeading: boolean
  headingLevel?: number
  isQuestion: boolean
  isExcluded: boolean
}

interface NumberingDefinition {
  numId: string
  format: string
}

export interface DetectionStats {
  totalQuestions: number
  mainQuestions: number
  subQuestions: number
  averageConfidence: number
  byMethod: Record<DetectionMethod, number>
}

// Export une instance singleton
export const docxQuestionDetector = new DocxQuestionDetector()


