/**
 * MODÈLE DE DONNÉES V1 - MÉMOIRES TECHNIQUES
 * 
 * Ce fichier formalise et verrouille le modèle de données V1 de l'application Redyce.
 * Il définit les entités, leurs périmètres et les règles métier strictes.
 * 
 * RÈGLES FONDAMENTALES V1 :
 * 
 * 1. IMMUABILITÉ DES QUESTIONS
 *    - Une fois extraites du template, les questions (TemplateQuestion) sont IMMUABLES
 *    - Aucune modification silencieuse n'est autorisée
 *    - Seule la suppression explicite par l'utilisateur est possible
 * 
 * 2. LIEN QUESTION + VERSION POUR LES RÉPONSES
 *    - Une réponse (MemoireSection.content) est TOUJOURS liée à :
 *      - Une question spécifique (via question/title qui référence TemplateQuestion)
 *      - Une version spécifique (via memoireId qui référence Memoire)
 *    - L'identifiant composite est : (question_id + memoire_id)
 * 
 * 3. VERSIONS = SNAPSHOTS FIGÉS
 *    - Une version de mémoire (Memoire avec versionNumber) est un snapshot à l'instant T
 *    - Lorsqu'une nouvelle version est créée, toutes les réponses sont clonées
 *    - Une version figée (isFrozen=true) ne peut plus être modifiée
 *    - Les réponses d'une version figée sont en lecture seule
 * 
 * 4. DONNÉES D'ENTREPRISE = GLOBALES AU PROJET
 *    - TemplateCompanyForm est lié au Document template (global au projet)
 *    - Ces données sont réutilisables entre tous les mémoires du projet
 *    - Lors de l'export, un snapshot est créé dans la version
 * 
 * 5. INTERDICTIONS STRICTES
 *    - INTERDIT : Réponses sans version (memoireId obligatoire)
 *    - INTERDIT : Modification silencieuse de la structure des questions
 *    - INTERDIT : Écrasement automatique de contenu sans action utilisateur explicite
 *    - INTERDIT : Modification d'une version figée
 */

// ============================================================================
// ENTITÉS PRINCIPALES
// ============================================================================

/**
 * PROJET
 * 
 * Périmètre :
 * - Conteneur principal regroupant tous les éléments d'un appel d'offres
 * - Propriété d'un utilisateur unique (userId)
 * 
 * Relations :
 * - 1 projet → N documents (Document)
 * - 1 projet → N mémoires (Memoire)
 * - 1 projet → 1 TemplateCompanyForm (via Document template)
 */
export interface ProjectV1 {
  id: string
  name: string
  description?: string
  userId: string // Propriétaire unique
  createdAt: Date
  updatedAt: Date
}

/**
 * TEMPLATE DE QUESTIONS (STRUCTURE IMMUABLE)
 * 
 * Périmètre :
 * - Document de type MODELE_MEMOIRE (Document)
 * - Structure de questions extraites du template
 * - UNE FOIS EXTRAIT, LA STRUCTURE EST IMMUABLE
 * 
 * Règles :
 * - TemplateSection et TemplateQuestion ne doivent JAMAIS être modifiés silencieusement
 * - Seule la suppression explicite par l'utilisateur est autorisée
 * - L'ajout de nouvelles questions doit être explicite (action utilisateur)
 * 
 * Relations :
 * - 1 Document (MODELE_MEMOIRE) → 1 TemplateCompanyForm
 * - 1 Document (MODELE_MEMOIRE) → N TemplateSection
 * - 1 TemplateSection → N TemplateQuestion
 */
export interface TemplateDocumentV1 {
  id: string
  documentId: string // Document de type MODELE_MEMOIRE
  projectId: string
  status: 'PARSING' | 'PARSED' | 'ERROR'
  
  // Structure immuable une fois extraite
  sections: TemplateSectionV1[]
  companyForm?: TemplateCompanyFormV1
}

/**
 * SECTION DE TEMPLATE (IMMUABLE)
 * 
 * Périmètre :
 * - Section/Item extraite du template (ex: "ITEM 1: Moyens humains")
 * - Structure immuable après extraction
 */
export interface TemplateSectionV1 {
  id: string
  documentId: string
  order: number // Ordre d'affichage (immuable)
  title: string // Titre de la section (ex: "ITEM 1: Moyens humains") - IMMUABLE
  required: boolean
  sourceAnchorJson?: any // Métadonnées de position dans le document
  
  questions: TemplateQuestionV1[] // Questions de cette section
}

/**
 * QUESTION DE TEMPLATE (IMMUABLE)
 * 
 * Périmètre :
 * - Question extraite du template
 * - Une fois extraite, la question est IMMUABLE
 * 
 * Règles strictes :
 * - title, order, questionType ne doivent JAMAIS être modifiés silencieusement
 * - Seule la suppression explicite est autorisée
 */
export interface TemplateQuestionV1 {
  id: string
  documentId: string
  sectionId?: string // Section parente (peut être null pour questions orphelines)
  order: number // Ordre dans la section - IMMUABLE
  title: string // Texte de la question - IMMUABLE
  questionType: 'TEXT' | 'YES_NO' // Type de question - IMMUABLE
  required: boolean // - IMMUABLE
  parentQuestionOrder?: number // Pour sous-questions
  isGroupHeader: boolean // Si true, pas de réponse attendue - IMMUABLE
  sourceAnchorJson?: any // Métadonnées de position
}

/**
 * DONNÉES D'ENTREPRISE (GLOBALES AU PROJET)
 * 
 * Périmètre :
 * - Informations réutilisables entre tous les mémoires d'un projet
 * - Liées au Document template (pas au mémoire)
 * 
 * Règles :
 * - Globales au projet (via templateDocumentId)
 * - Réutilisables entre tous les mémoires
 * - Lors de l'export, un snapshot est créé dans la version
 */
export interface TemplateCompanyFormV1 {
  id: string
  documentId: string // Document template - UNIQUE par template
  fields: CompanyFormFieldV1[] // Champs structurés (nom, rédacteur, date, etc.)
  companyPresentation?: string // Texte libre de présentation entreprise
  extractedAt: Date
  updatedAt: Date
}

export interface CompanyFormFieldV1 {
  label: string
  type: 'text' | 'date' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
  value?: string // Valeur saisie par l'utilisateur
}

/**
 * MÉMOIRE TECHNIQUE (VERSION)
 * 
 * Périmètre :
 * - Un mémoire = une version spécifique
 * - Chaque version est un snapshot à l'instant T
 * 
 * Règles strictes :
 * - versionNumber : Numéro séquentiel (1, 2, 3...)
 * - parentMemoireId : Lien vers la version parente (pour versioning)
 * - isFrozen : Si true, la version est figée (read-only)
 * - templateDocumentId : Référence au template source (immuable)
 * 
 * Relations :
 * - 1 Memoire → N MemoireSection (réponses)
 * - 1 Memoire → 0..1 parentMemoire (version précédente)
 * - 1 Memoire → N childMemos (versions suivantes)
 */
export interface MemoireV1 {
  id: string
  projectId: string
  userId: string
  title: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'EXPORTED'
  templateDocumentId: string // Template source - IMMUABLE
  versionNumber: number // 1, 2, 3... - SÉQUENTIEL
  parentMemoireId?: string // Version parente (pour versioning)
  isFrozen: boolean // Si true, version figée (read-only)
  metadata?: any
  
  // Sections/réponses de cette version
  sections: MemoireSectionV1[]
}

/**
 * RÉPONSE (LIÉE À QUESTION + VERSION)
 * 
 * Périmètre :
 * - Une réponse = contenu pour une question spécifique dans une version spécifique
 * - TOUJOURS liée à une version (memoireId obligatoire)
 * 
 * Règles strictes :
 * - memoireId : OBLIGATOIRE (réponse toujours liée à une version)
 * - question : Référence au texte de la question (pour traçabilité)
 * - order : Ordre dans la version (peut différer du template si réorganisation)
 * - content : Contenu de la réponse (mutable uniquement si version non figée)
 * 
 * Identifiant composite :
 * - (memoireId + order) pour l'unicité dans une version
 * - Référence implicite à TemplateQuestion via question/title
 */
export interface MemoireSectionV1 {
  id: string
  memoireId: string // Version parente - OBLIGATOIRE
  title: string // Titre de la section (copié du template)
  order: number // Ordre dans cette version
  question?: string // Texte de la question (référence au TemplateQuestion)
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEWED' | 'VALIDATED'
  content?: string // Contenu de la réponse (mutable si version non figée)
  validatedBy?: string // userId du validateur
  validatedAt?: Date // Date de validation
  sourceRequirementIds: string[] // IDs des exigences sources liées
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// RÈGLES DE VALIDATION
// ============================================================================

/**
 * VALIDATION : Réponse doit avoir une version
 */
export function validateSectionHasVersion(section: MemoireSectionV1): void {
  if (!section.memoireId) {
    throw new Error('VALIDATION ERROR: MemoireSection must have a memoireId (section is always tied to a version)')
  }
}

/**
 * VALIDATION : Version figée ne peut pas être modifiée
 */
export function validateVersionNotFrozen(memoire: MemoireV1): void {
  if (memoire.isFrozen) {
    throw new Error('VALIDATION ERROR: Cannot modify frozen version (isFrozen=true). Create a new version instead.')
  }
}

/**
 * VALIDATION : Question template immuable
 */
export function validateQuestionImmutability(question: TemplateQuestionV1, updates: Partial<TemplateQuestionV1>): void {
  const immutableFields: (keyof TemplateQuestionV1)[] = ['title', 'order', 'questionType', 'required', 'isGroupHeader']
  const modifiedImmutableFields = immutableFields.filter(field => updates[field] !== undefined && updates[field] !== question[field])
  
  if (modifiedImmutableFields.length > 0) {
    throw new Error(`VALIDATION ERROR: Cannot modify immutable question fields: ${modifiedImmutableFields.join(', ')}. Questions are immutable after extraction.`)
  }
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Identifiant composite d'une réponse
 * Permet de référencer de manière unique une réponse dans une version
 */
export interface SectionIdentifier {
  memoireId: string // Version
  order: number // Position dans la version
  questionReference?: string // Référence optionnelle à la question template (pour traçabilité)
}

/**
 * Snapshot des données d'entreprise au moment de l'export
 * Copié dans la version lors de l'export pour garantir la traçabilité
 */
export interface CompanyDataSnapshot {
  fields: CompanyFormFieldV1[]
  companyPresentation?: string
  snapshotDate: Date
  templateCompanyFormId: string // Référence au formulaire source
}


