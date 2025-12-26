/**
 * Définitions des étapes de tutoriel par page
 * Chaque étape a un ID unique, un texte, et un sélecteur CSS pour cibler l'élément
 */

export type TutorialStepId = string

export interface TutorialStep {
  id: TutorialStepId
  page: string // Pattern de route (ex: "/projects" ou "/projects/[id]/memoire")
  selector: string // Sélecteur CSS de l'élément à mettre en avant
  clickTarget?: string // Sélecteur CSS de l'élément à cliquer (si différent de selector)
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  order: number // Ordre d'affichage sur cette page
  globalOrder: number // Ordre global dans le tutoriel complet
  nextStepId?: TutorialStepId // Prochaine étape (peut être sur une autre page)
  action?: 'click' | 'hover' | 'none' // Action attendue pour passer à l'étape suivante
  highlightPadding?: number // Padding autour de l'élément (défaut: 8)
  showCondition?: { // Condition pour afficher cette étape (optionnel)
    selector: string // Sélecteur de l'élément à vérifier
    attribute: string // Attribut data-* à vérifier
    value: string // Valeur attendue pour afficher l'étape
  }
  skipIfConditionFalse?: boolean // Si true et condition false, passer à l'étape suivante
  continueCondition?: { // Condition pour activer le bouton "Continuer" (optionnel)
    selector: string // Sélecteur de l'élément à vérifier
    attribute: string // Attribut data-* à vérifier
    value: string // Valeur attendue pour activer le bouton
    hint?: string // Message à afficher quand la condition n'est pas remplie
  }
}

/**
 * Toutes les étapes de tutoriel dans l'ordre du parcours utilisateur
 *
 * FLOW COMPLET (17 étapes principales + 2 conditionnelles) :
 * 1. Dashboard - Bienvenue
 * 2. Dashboard - Créer un client (clic)
 * 3. Création client - Formulaire (clic sur "Créer le client")
 * 4. Projets client - Créer un projet (clic)
 * 5. Aperçu projet - Cliquer sur Entreprise
 * 6. Entreprise - Les 4 onglets
 * 7. Entreprise - Extraction IA (optionnel)
 * 7b. Entreprise - Sauvegarder le profil (clic) - CONDITIONNEL : si profil modifié
 * 7c. Entreprise - Cliquer sur Documents (clic) - après sauvegarde
 * 8. Documents - Modèle de mémoire
 * 9. Documents - Documents de contexte
 * 10. Exigences - Visite de la page
 * 11. Exigences - Extraction des questions
 * 12. Mémoire - Vue d'ensemble
 * 13. Mémoire - Génération IA
 * 14. Mémoire - Changer le statut
 * 15. Mémoire - Générer tout
 * 16. Exports - Exporter le mémoire
 * 17. Exports - Historique
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  // ============================================================================
  // 1. DASHBOARD - Première connexion
  // ============================================================================
  {
    id: 'dashboard-welcome',
    page: '/dashboard',
    selector: '[data-tutorial="dashboard-header"]',
    title: 'Bienvenue sur Redyce !',
    description: 'Redyce vous aide à rédiger vos mémoires techniques grâce à l\'IA. Découvrons ensemble les fonctionnalités principales.',
    position: 'center',
    order: 1,
    globalOrder: 1,
    nextStepId: 'dashboard-create-client',
    action: 'none',
  },
  {
    id: 'dashboard-create-client',
    page: '/dashboard',
    selector: '[data-tutorial="create-client-btn"]',
    title: 'Créer votre premier client',
    description: 'Commencez par créer un client. Chaque client représente une entreprise pour laquelle vous rédigez des mémoires techniques.',
    position: 'bottom',
    order: 2,
    globalOrder: 2,
    nextStepId: 'client-new-form',
    action: 'click',
  },

  // ============================================================================
  // 2. CRÉATION CLIENT
  // ============================================================================
  {
    id: 'client-new-form',
    page: '/clients/new',
    selector: '[data-tutorial="client-form"]',
    clickTarget: '[data-tutorial="client-submit-btn"]',
    title: 'Créer le client',
    description: 'Remplissez au minimum le nom du client, puis cliquez sur "Créer le client" pour continuer.',
    position: 'top',
    order: 1,
    globalOrder: 3,
    action: 'click',
    nextStepId: 'client-projects-list',
  },

  // ============================================================================
  // 3. PROJETS DU CLIENT
  // ============================================================================
  {
    id: 'client-projects-list',
    page: '/clients/[id]/projects',
    selector: '[data-tutorial="projects-header"]',
    clickTarget: '[data-tutorial="create-project-btn"], [data-tutorial="projects-table-body"]',
    title: 'Liste des projets',
    description: 'Ici s\'affichent tous les projets de ce client. Cliquez sur le nom d\'un projet ou sur "Nouveau projet" pour continuer.',
    position: 'top',
    order: 1,
    globalOrder: 4,
    nextStepId: 'project-overview',
    action: 'click',
  },

  // ============================================================================
  // 4. PAGE APERÇU PROJET
  // ============================================================================
  {
    id: 'project-overview',
    page: '/projects/[id]',
    selector: '[data-tutorial="nav-company"]',
    title: 'Aperçu du projet',
    description: 'Voici l\'aperçu de votre projet. Commencez par configurer le profil de l\'entreprise en cliquant sur "Entreprise".',
    position: 'bottom',
    order: 1,
    globalOrder: 5,
    nextStepId: 'company-tabs',
    action: 'click',
  },

  // ============================================================================
  // 5. PAGE ENTREPRISE
  // ============================================================================
  {
    id: 'company-tabs',
    page: '/projects/[id]/company',
    selector: '[data-tutorial="company-tabs"]',
    title: 'Configuration de l\'entreprise',
    description: 'Cette page contient 4 onglets : Profil, Méthodologie travail, Méthodologie rédaction et Documents de référence.\n\nSi vous avez une plaquette ou un récapitulatif de l\'entreprise, vous pouvez l\'uploader pour préremplir automatiquement les champs.',
    position: 'bottom',
    order: 1,
    globalOrder: 6,
    nextStepId: 'company-ai-extract',
    action: 'none',
    highlightPadding: 8,
  },
  {
    id: 'company-ai-extract',
    page: '/projects/[id]/company',
    selector: '[data-tutorial="company-ai-extract"]',
    title: 'Remplissage automatique (optionnel)',
    description: 'Vous pouvez remplir les champs manuellement, ou uploader un document (plaquette, présentation...) pour que l\'IA pré-remplisse les champs automatiquement.',
    position: 'bottom',
    order: 2,
    globalOrder: 7,
    nextStepId: 'company-save',
    action: 'none',
    highlightPadding: 8,
  },
  {
    id: 'company-save',
    page: '/projects/[id]/company',
    selector: '[data-tutorial="company-save-btn"]',
    title: 'Sauvegarder le profil',
    description: 'Une fois les informations remplies (manuellement ou via l\'IA), cliquez sur ce bouton pour sauvegarder le profil. Sans sauvegarde, vos modifications seront perdues.',
    position: 'left',
    order: 3,
    globalOrder: 7.5, // 7 bis - étape conditionnelle, ne compte pas dans le total
    nextStepId: 'company-go-documents',
    action: 'click',
    highlightPadding: 8,
    showCondition: {
      selector: '[data-tutorial="company-save-btn"]',
      attribute: 'data-profile-dirty',
      value: 'true',
    },
    skipIfConditionFalse: true,
  },
  {
    id: 'company-go-documents',
    page: '/projects/[id]/company',
    selector: '[data-tutorial="nav-documents"]',
    title: 'Passer aux documents',
    description: 'Parfait ! Maintenant, cliquez sur l\'onglet "Documents" pour ajouter votre modèle de mémoire et les documents du DCE.',
    position: 'bottom',
    order: 4,
    globalOrder: 7.6, // 7 ter - étape conditionnelle, ne compte pas dans le total
    nextStepId: 'documents-template',
    action: 'click',
    highlightPadding: 4,
  },

  // ============================================================================
  // 6. PAGE DOCUMENTS
  // ============================================================================
  {
    id: 'documents-template',
    page: '/projects/[id]/documents',
    selector: '[data-tutorial="template-section"]',
    title: 'Modèle de mémoire technique',
    description: 'Uploadez votre modèle de mémoire technique. L\'IA extraira automatiquement les questions et la structure à remplir.',
    position: 'left',
    order: 1,
    globalOrder: 8,
    nextStepId: 'documents-context',
    action: 'none',
    highlightPadding: 16,
    continueCondition: {
      selector: '[data-tutorial="template-section"]',
      attribute: 'data-has-template',
      value: 'true',
      hint: 'Uploadez un template pour continuer',
    },
  },
  {
    id: 'documents-context',
    page: '/projects/[id]/documents',
    selector: '[data-tutorial="context-section"]',
    title: 'Documents de contexte',
    description: 'Ajoutez les documents du DCE (RC, CCTP, CCAP...). L\'IA les analysera pour enrichir les réponses de votre mémoire.\nVous pourrez ensuite catégoriser chaque document dans le tableau ci-dessous.',
    position: 'left',
    order: 2,
    globalOrder: 9,
    nextStepId: 'requirements-overview',
    action: 'none',
    highlightPadding: 16,
  },

  // ============================================================================
  // 7. PAGE EXIGENCES
  // ============================================================================
  {
    id: 'requirements-overview',
    page: '/projects/[id]/exigences',
    selector: '[data-tutorial="exigences-list"]',
    title: 'Exigences',
    description: 'Voici la page des exigences. Ici s\'afficheront les exigences extraites des documents du DCE.\nVous pourrez les modifier, en ajouter ou en supprimer. Plus les exigences sont précises, meilleure sera la qualité des réponses générées.',
    position: 'top',
    order: 1,
    globalOrder: 10,
    nextStepId: 'questions-overview',
    action: 'none',
  },

  // ============================================================================
  // 8. PAGE QUESTIONS
  // ============================================================================
  {
    id: 'questions-overview',
    page: '/projects/[id]/questions',
    selector: '[data-tutorial="questions-list"]',
    title: 'Questions',
    description: 'Voici la page des questions. Ici s\'afficheront les questions extraites de votre modèle de mémoire.\nCliquez sur "Extraire les questions" pour analyser le template.',
    position: 'top',
    order: 1,
    globalOrder: 11,
    nextStepId: 'questions-go-memoire',
    action: 'none',
    continueCondition: {
      selector: '[data-tutorial="questions-list"]',
      attribute: 'data-has-questions',
      value: 'true',
    },
  },
  {
    id: 'questions-go-memoire',
    page: '/projects/[id]/questions',
    selector: '[data-tutorial="go-memoire-btn"]',
    title: 'Passer au mémoire',
    description: 'Les questions sont extraites ! Cliquez sur ce bouton pour créer ou accéder au mémoire.',
    position: 'left',
    order: 2,
    globalOrder: 12,
    nextStepId: 'memoire-overview',
    action: 'click',
    highlightPadding: 8,
  },

  // ============================================================================
  // 9. PAGE MÉMOIRE
  // ============================================================================
  {
    id: 'memoire-overview',
    page: '/projects/[id]/memoire',
    selector: '[data-tutorial="memoire-header"]',
    title: 'Rédaction du mémoire',
    description: 'C\'est ici que vous rédigez votre mémoire technique. Chaque question correspond à une section de votre document final.',
    position: 'bottom',
    order: 1,
    globalOrder: 13,
    nextStepId: 'memoire-ai-generate',
    action: 'none',
  },
  {
    id: 'memoire-ai-generate',
    page: '/projects/[id]/memoire',
    selector: '[data-tutorial="ai-generate-btn"]',
    title: 'Génération IA',
    description: 'Cliquez sur ce bouton pour générer une réponse avec l\'IA. Elle utilisera le profil de l\'entreprise et les documents du DCE pour créer une réponse personnalisée.',
    position: 'left',
    order: 2,
    globalOrder: 14,
    nextStepId: 'memoire-status',
    action: 'none',
  },
  {
    id: 'memoire-status',
    page: '/projects/[id]/memoire',
    selector: '[data-tutorial="memoire-status"]',
    title: 'Valider la réponse',
    description: 'Une fois la réponse satisfaisante, changez son statut de "Brouillon" à "Validé". Seules les réponses validées seront incluses dans l\'export.',
    position: 'left',
    order: 3,
    globalOrder: 15,
    nextStepId: 'memoire-generate-all',
    action: 'none',
  },
  {
    id: 'memoire-generate-all',
    page: '/projects/[id]/memoire',
    selector: '[data-tutorial="generate-all-btn"]',
    title: 'Génération en masse',
    description: 'Pour gagner du temps, générez toutes les réponses en un clic. L\'IA traitera chaque question séquentiellement. Vous pourrez ensuite les relire et les valider.',
    position: 'bottom',
    order: 4,
    globalOrder: 16,
    action: 'none',
  },

  // ============================================================================
  // 10. PAGE EXPORTS
  // ============================================================================
  {
    id: 'exports-generate',
    page: '/projects/[id]/exports',
    selector: '[data-tutorial="export-btn"]',
    title: 'Exporter le mémoire',
    description: 'Générez un fichier DOCX prêt à soumettre. Les réponses validées sont injectées dans votre modèle en conservant la mise en forme.',
    position: 'bottom',
    order: 1,
    globalOrder: 17,
    nextStepId: 'exports-history',
    action: 'none',
  },
  {
    id: 'exports-history',
    page: '/projects/[id]/exports',
    selector: '[data-tutorial="exports-table"]',
    title: 'Historique des exports',
    description: 'Retrouvez ici tous vos exports précédents. Vous pouvez les télécharger à nouveau ou les supprimer. Félicitations, vous maîtrisez maintenant Redyce !',
    position: 'top',
    order: 2,
    globalOrder: 18,
    action: 'none',
  },
]

/**
 * Récupère les étapes de tutoriel pour une page donnée
 */
export function getStepsForPage(pathname: string): TutorialStep[] {
  // Normaliser le chemin (remplacer les IDs dynamiques, mais pas "new")
  const normalizedPath = pathname
    .replace(/\/projects\/(?!new)[^/]+/, '/projects/[id]')
    .replace(/\/clients\/(?!new)[^/]+/, '/clients/[id]')

  // Matcher aussi les sous-pages (ex: /settings/tutorial match /settings)
  const matchingSteps = TUTORIAL_STEPS.filter(step => {
    // Match exact
    if (step.page === normalizedPath) return true
    // Match parent (ex: /settings match /settings/tutorial)
    if (normalizedPath.startsWith(step.page + '/')) return true
    return false
  })

  return matchingSteps.sort((a, b) => a.order - b.order)
}

/**
 * Récupère une étape par son ID
 */
export function getStepById(id: TutorialStepId): TutorialStep | undefined {
  return TUTORIAL_STEPS.find(step => step.id === id)
}

/**
 * Récupère la première étape non complétée pour une page
 */
export function getFirstUncompletedStep(
  pathname: string,
  completedSteps: TutorialStepId[]
): TutorialStep | undefined {
  const pageSteps = getStepsForPage(pathname)
  return pageSteps.find(step => !completedSteps.includes(step.id))
}

/**
 * Récupère la prochaine étape globale non complétée (dans l'ordre globalOrder)
 */
export function getNextGlobalStep(
  completedSteps: TutorialStepId[]
): TutorialStep | undefined {
  // Trier par globalOrder et trouver la première non complétée
  const sortedSteps = [...TUTORIAL_STEPS].sort((a, b) => a.globalOrder - b.globalOrder)
  return sortedSteps.find(step => !completedSteps.includes(step.id))
}

/**
 * Vérifie si une étape est la prochaine étape globale à afficher
 * (pour éviter d'afficher des étapes "en avance" sur d'autres pages)
 */
export function isNextGlobalStep(
  stepId: TutorialStepId,
  completedSteps: TutorialStepId[]
): boolean {
  const nextStep = getNextGlobalStep(completedSteps)
  return nextStep?.id === stepId
}

/**
 * Calcule la progression globale du tutoriel
 * Note: Les étapes conditionnelles (globalOrder non entier) ne sont pas comptées dans le total
 */
export function getTutorialProgress(completedSteps: TutorialStepId[]): {
  completed: number
  total: number
  percentage: number
} {
  // Exclure les étapes conditionnelles (globalOrder non entier comme 7.5)
  const mainSteps = TUTORIAL_STEPS.filter(step => Number.isInteger(step.globalOrder))
  const total = mainSteps.length

  // Ne compter que les étapes principales complétées
  const completed = completedSteps.filter(id =>
    mainSteps.some(step => step.id === id)
  ).length

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  }
}

/**
 * Récupère l'ordre global d'une étape
 */
export function getGlobalOrder(stepId: TutorialStepId): number {
  const step = TUTORIAL_STEPS.find(s => s.id === stepId)
  return step?.globalOrder ?? 0
}

/**
 * Récupère le nombre total d'étapes dans le tutoriel
 */
export function getTotalSteps(): number {
  return TUTORIAL_STEPS.length
}
