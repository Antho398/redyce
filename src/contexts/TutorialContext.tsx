/**
 * Contexte de tutoriel pour gérer l'onboarding utilisateur
 *
 * Fonctionnalités :
 * - Gestion de l'état du tutoriel (activé/désactivé)
 * - Suivi des étapes complétées (persisté en BDD)
 * - Changement de style UI (tooltip/spotlight)
 * - Déclenchement automatique à la première connexion
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  TutorialStep,
  TutorialStepId,
  getStepsForPage,
  getFirstUncompletedStep,
  getNextGlobalStep,
  getTutorialProgress,
  getStepById,
  TUTORIAL_STEPS,
} from '@/lib/tutorial/steps'

export type TutorialStyle = 'tooltip' | 'spotlight'

interface TutorialState {
  enabled: boolean
  completedSteps: TutorialStepId[]
  style: TutorialStyle
  isLoading: boolean
}

interface TutorialContextType {
  // État
  enabled: boolean
  style: TutorialStyle
  completedSteps: TutorialStepId[]
  currentStep: TutorialStep | null
  stepsForCurrentPage: TutorialStep[]
  progress: { completed: number; total: number; percentage: number }
  pageProgress: { completed: number; total: number; currentIndex: number }
  isLoading: boolean

  // Actions
  setEnabled: (enabled: boolean) => Promise<void>
  setStyle: (style: TutorialStyle) => Promise<void>
  completeStep: (stepId: TutorialStepId) => Promise<void>
  uncompleteStep: (stepId: TutorialStepId) => Promise<void>
  skipStep: () => void
  resetTutorial: () => Promise<void>
  goToNextStep: () => void
  goToPreviousStep: () => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

interface TutorialProviderProps {
  children: ReactNode
  initialState?: {
    enabled: boolean
    completedSteps: string[]
    style: string
  }
}

export function TutorialProvider({ children, initialState }: TutorialProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()

  const [state, setState] = useState<TutorialState>({
    enabled: initialState?.enabled ?? true,
    completedSteps: initialState?.completedSteps ?? [],
    style: (initialState?.style as TutorialStyle) ?? 'tooltip',
    isLoading: !initialState, // Si pas d'état initial, on doit charger
  })

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Charger l'état initial depuis l'API si pas fourni
  useEffect(() => {
    if (initialState) return

    const loadState = async () => {
      try {
        const response = await fetch('/api/user/tutorial')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setState({
              enabled: data.data.tutorialEnabled,
              completedSteps: data.data.tutorialCompletedSteps || [],
              style: data.data.tutorialStyle || 'tooltip',
              isLoading: false,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load tutorial state:', error)
      } finally {
        setState(s => ({ ...s, isLoading: false }))
      }
    }

    loadState()
  }, [initialState])

  // Calculer les étapes pour la page actuelle
  const stepsForCurrentPage = getStepsForPage(pathname)

  // Trouver la prochaine étape globale non complétée
  const nextGlobalStep = getNextGlobalStep(state.completedSteps)

  // Ref pour éviter les auto-complétion multiples
  const hasAutoCompletedRef = useRef(false)

  // Auto-compléter les étapes manquantes (gaps) dans la progression
  // Cela gère le cas où certaines étapes ont été sautées par erreur
  // Ne s'exécute qu'une seule fois après le chargement initial
  useEffect(() => {
    if (!state.enabled || state.isLoading || state.completedSteps.length === 0) return
    if (hasAutoCompletedRef.current) return

    // Trouver l'étape complétée avec le globalOrder le plus élevé
    const completedWithOrder = state.completedSteps
      .map(id => TUTORIAL_STEPS.find(s => s.id === id))
      .filter((s): s is TutorialStep => s !== undefined)
      .sort((a, b) => b.globalOrder - a.globalOrder)

    if (completedWithOrder.length === 0) return

    const highestCompletedOrder = completedWithOrder[0].globalOrder

    // Trouver toutes les étapes avec un globalOrder inférieur qui ne sont pas complétées
    const missingSteps = TUTORIAL_STEPS.filter(
      s => s.globalOrder < highestCompletedOrder && !state.completedSteps.includes(s.id)
    )

    if (missingSteps.length > 0) {
      hasAutoCompletedRef.current = true
      const newCompletedSteps = [...state.completedSteps, ...missingSteps.map(s => s.id)]
      setState(s => ({ ...s, completedSteps: newCompletedSteps }))
      // Mettre à jour le serveur
      fetch('/api/user/tutorial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialCompletedSteps: newCompletedSteps }),
      }).catch(console.error)
    }
  }, [state.enabled, state.isLoading, state.completedSteps])

  // Vérifier si une condition d'affichage est remplie
  const checkShowCondition = useCallback((step: TutorialStep): boolean => {
    if (!step.showCondition) return true

    const element = document.querySelector(step.showCondition.selector)
    if (!element) return false

    const attrValue = element.getAttribute(step.showCondition.attribute)
    return attrValue === step.showCondition.value
  }, [])

  // L'étape actuelle n'est affichée que si :
  // 1. Le tutoriel est activé
  // 2. La prochaine étape globale est sur la page actuelle
  // 3. La condition d'affichage est remplie (si définie)
  const currentStep = (() => {
    if (!state.enabled || !nextGlobalStep) return null

    // Vérifier si la prochaine étape globale est sur cette page
    const isOnCurrentPage = stepsForCurrentPage.some(s => s.id === nextGlobalStep.id)

    return isOnCurrentPage ? nextGlobalStep : null
  })()

  // État pour tracker si on doit skip une étape conditionnelle
  const [shouldSkipCurrentStep, setShouldSkipCurrentStep] = useState(false)

  // Vérifier la condition d'affichage de l'étape actuelle
  useEffect(() => {
    if (!currentStep || !state.enabled || state.isLoading) {
      setShouldSkipCurrentStep(false)
      return
    }
    if (!currentStep.showCondition || !currentStep.skipIfConditionFalse) {
      setShouldSkipCurrentStep(false)
      return
    }

    // Vérifier la condition après un court délai (pour laisser le DOM se mettre à jour)
    const checkCondition = () => {
      const conditionMet = checkShowCondition(currentStep)
      setShouldSkipCurrentStep(!conditionMet)
    }

    // Vérifier après un délai
    const timeout = setTimeout(checkCondition, 100)
    return () => clearTimeout(timeout)
  }, [currentStep?.id, state.enabled, state.isLoading, checkShowCondition])

  // Calculer la progression globale
  const progress = getTutorialProgress(state.completedSteps)

  // Calculer la progression pour la page actuelle
  const pageProgress = (() => {
    const total = stepsForCurrentPage.length
    const completedOnPage = stepsForCurrentPage.filter(s => state.completedSteps.includes(s.id)).length
    const currentIndex = currentStep
      ? stepsForCurrentPage.findIndex(s => s.id === currentStep.id) + 1
      : completedOnPage + 1
    return { completed: completedOnPage, total, currentIndex: Math.min(currentIndex, total) }
  })()

  // Mettre à jour l'état sur le serveur
  const updateServer = useCallback(async (updates: Partial<{
    tutorialEnabled: boolean
    tutorialCompletedSteps: string[]
    tutorialStyle: string
  }>): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/tutorial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        console.error('Failed to update tutorial state: HTTP', response.status)
        return false
      }
      return true
    } catch (error) {
      console.error('Failed to update tutorial state:', error)
      return false
    }
  }, [])

  // Actions
  const setEnabled = useCallback(async (enabled: boolean) => {
    setState(s => ({ ...s, enabled }))
    await updateServer({ tutorialEnabled: enabled })

    if (enabled) {
      toast.success('Tutoriel activé', {
        description: 'Les conseils apparaîtront sur chaque page.',
      })
    } else {
      toast.info('Tutoriel désactivé', {
        description: 'Vous pouvez le réactiver dans les paramètres.',
      })
    }
  }, [updateServer])

  const setStyle = useCallback(async (style: TutorialStyle) => {
    setState(s => ({ ...s, style }))
    await updateServer({ tutorialStyle: style })
  }, [updateServer])

  const completeStep = useCallback(async (stepId: TutorialStepId) => {
    if (state.completedSteps.includes(stepId)) return

    const newCompletedSteps = [...state.completedSteps, stepId]
    setState(s => ({ ...s, completedSteps: newCompletedSteps }))
    await updateServer({ tutorialCompletedSteps: newCompletedSteps })

    // Vérifier si on a terminé tout le tutoriel
    const newProgress = getTutorialProgress(newCompletedSteps)
    if (newProgress.percentage === 100) {
      toast.success('Tutoriel terminé !', {
        description: 'Vous maîtrisez maintenant les bases de Redyce.',
      })
    }
  }, [state.completedSteps, updateServer])

  // Retirer une étape de la liste des étapes complétées (pour revenir en arrière)
  const uncompleteStep = useCallback(async (stepId: TutorialStepId) => {
    if (!state.completedSteps.includes(stepId)) return

    const newCompletedSteps = state.completedSteps.filter(id => id !== stepId)
    setState(s => ({ ...s, completedSteps: newCompletedSteps }))
    await updateServer({ tutorialCompletedSteps: newCompletedSteps })
  }, [state.completedSteps, updateServer])

  const skipStep = useCallback(() => {
    if (currentStep) {
      completeStep(currentStep.id)
    }
  }, [currentStep, completeStep])

  // Auto-skip les étapes conditionnelles si la condition n'est pas remplie
  useEffect(() => {
    if (shouldSkipCurrentStep && currentStep) {
      completeStep(currentStep.id)
    }
  }, [shouldSkipCurrentStep, currentStep, completeStep])

  const resetTutorial = useCallback(async () => {
    setState(s => ({ ...s, completedSteps: [], enabled: true }))
    await updateServer({ tutorialCompletedSteps: [], tutorialEnabled: true })
    setCurrentStepIndex(0)
    toast.success('Tutoriel réinitialisé', {
      description: 'Vous pouvez recommencer le tutoriel depuis le début.',
    })
  }, [updateServer])

  const goToNextStep = useCallback(() => {
    if (currentStep) {
      completeStep(currentStep.id)

      // Si l'étape suivante est sur une autre page, naviguer vers cette page
      if (currentStep.nextStepId) {
        const nextStep = getStepById(currentStep.nextStepId)
        if (nextStep && nextStep.page !== currentStep.page) {
          // Remplacer les placeholders [id] par l'ID réel du projet
          let targetPath = nextStep.page
          if (params?.id) {
            targetPath = targetPath.replace('[id]', params.id as string)
          }
          router.push(targetPath)
        }
      }
    }
  }, [currentStep, completeStep, router, params])

  const goToPreviousStep = useCallback(() => {
    if (!currentStep) return

    // Trouver l'étape précédente dans l'ordre global
    const currentGlobalOrder = currentStep.globalOrder
    const previousStep = TUTORIAL_STEPS
      .filter(s => s.globalOrder < currentGlobalOrder)
      .sort((a, b) => b.globalOrder - a.globalOrder)[0]

    if (!previousStep) return

    // Retirer l'étape précédente de la liste des étapes complétées
    const newCompletedSteps = state.completedSteps.filter(id => id !== previousStep.id)
    setState(s => ({ ...s, completedSteps: newCompletedSteps }))
    updateServer({ tutorialCompletedSteps: newCompletedSteps })

    // Si l'étape précédente est sur une autre page, naviguer vers cette page
    if (previousStep.page !== currentStep.page) {
      let targetPath = previousStep.page
      if (params?.id) {
        targetPath = targetPath.replace('[id]', params.id as string)
      }
      router.push(targetPath)
    }
  }, [currentStep, state.completedSteps, updateServer, router, params])

  return (
    <TutorialContext.Provider
      value={{
        enabled: state.enabled,
        style: state.style,
        completedSteps: state.completedSteps,
        currentStep,
        stepsForCurrentPage,
        progress,
        pageProgress,
        isLoading: state.isLoading,
        setEnabled,
        setStyle,
        completeStep,
        uncompleteStep,
        skipStep,
        resetTutorial,
        goToNextStep,
        goToPreviousStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

/**
 * Hook pour vérifier si une étape spécifique doit être affichée
 */
export function useTutorialStep(stepId: TutorialStepId) {
  const { enabled, completedSteps, currentStep } = useTutorial()

  return {
    isActive: enabled && currentStep?.id === stepId,
    isCompleted: completedSteps.includes(stepId),
    shouldShow: enabled && currentStep?.id === stepId && !completedSteps.includes(stepId),
  }
}
