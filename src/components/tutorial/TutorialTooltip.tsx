/**
 * Composant Tooltip pour le tutoriel
 * Style discret inspiré de Notion - apparaît à côté de l'élément ciblé
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft, SkipForward, MousePointerClick, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTutorial } from '@/contexts/TutorialContext'
import { cn } from '@/lib/utils/helpers'

interface TooltipPosition {
  top: number
  left: number
  arrowPosition: 'top' | 'bottom' | 'left' | 'right'
}

export function TutorialTooltip() {
  const { currentStep, enabled, progress, goToNextStep, goToPreviousStep, skipStep, setEnabled, completeStep, uncompleteStep, completedSteps } = useTutorial()
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [canContinue, setCanContinue] = useState(true)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const hasAutoAdvancedRef = useRef(false)

  // Reset du drag offset quand on change d'étape
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
    hasAutoAdvancedRef.current = false
  }, [currentStep?.id])

  // Gestion du drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tooltipRef.current) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    }
  }, [dragOffset])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      setDragOffset({
        x: dragStartRef.current.offsetX + deltaX,
        y: dragStartRef.current.offsetY + deltaY,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Effet pour surveiller la suppression du template et revenir à l'étape 8
  // Utilise un polling car le MutationObserver ne détecte pas toujours les changements React
  useEffect(() => {
    // Si on est sur une étape après documents-template et que documents-template est complété
    if (!enabled || !completedSteps.includes('documents-template')) return

    const checkTemplateStatus = () => {
      const element = document.querySelector('[data-tutorial="template-section"]')
      if (!element) return

      const hasTemplate = element.getAttribute('data-has-template') === 'true'

      // Si le template a été supprimé, revenir à l'étape 8
      if (!hasTemplate) {
        uncompleteStep('documents-template')
      }
    }

    // Vérifier immédiatement
    checkTemplateStatus()

    // Observer les changements d'attribut
    const element = document.querySelector('[data-tutorial="template-section"]')
    if (element) {
      const observer = new MutationObserver(checkTemplateStatus)
      observer.observe(element, { attributes: true, attributeFilter: ['data-has-template'] })

      // Aussi utiliser un polling comme backup (toutes les 500ms)
      const interval = setInterval(checkTemplateStatus, 500)

      return () => {
        observer.disconnect()
        clearInterval(interval)
      }
    }
  }, [enabled, completedSteps, uncompleteStep])

  // Effet pour positionner le tooltip
  useEffect(() => {
    if (!currentStep || !enabled) {
      setIsVisible(false)
      return
    }

    let resizeObserver: ResizeObserver | null = null
    let retryInterval: NodeJS.Timeout | null = null
    let initialDelay: NodeJS.Timeout | null = null

    const handleResize = () => {
      const element = document.querySelector(currentStep.selector)
      if (element) {
        calculatePosition(element as HTMLElement)
      }
    }

    const setupObservers = (element: HTMLElement) => {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(element)
      window.addEventListener('resize', handleResize)
    }

    // Attendre que le DOM soit prêt (petit délai pour le rendu initial)
    initialDelay = setTimeout(() => {
      // Trouver l'élément cible
      const targetElement = document.querySelector(currentStep.selector)

      if (!targetElement) {
        // Si l'élément n'est pas trouvé, on attend un peu et on réessaie plusieurs fois
        let retryCount = 0
        const maxRetries = 5

        retryInterval = setInterval(() => {
          retryCount++
          const retryElement = document.querySelector(currentStep.selector)

          if (retryElement) {
            if (retryInterval) clearInterval(retryInterval)
            calculatePosition(retryElement as HTMLElement)
            setupObservers(retryElement as HTMLElement)
          } else if (retryCount >= maxRetries) {
            if (retryInterval) clearInterval(retryInterval)
            // L'élément n'existe pas sur cette page, passer cette étape silencieusement
            setIsVisible(false)
          }
        }, 500)
      } else {
        calculatePosition(targetElement as HTMLElement)
        setupObservers(targetElement as HTMLElement)
      }
    }, 300)

    return () => {
      if (initialDelay) clearTimeout(initialDelay)
      if (retryInterval) clearInterval(retryInterval)
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [currentStep, enabled])

  // Effet pour détecter le clic sur l'élément ciblé (pour les étapes action: 'click')
  useEffect(() => {
    if (!currentStep || !enabled || currentStep.action !== 'click') {
      return
    }

    const handleTargetClick = () => {
      // Compléter l'étape quand l'utilisateur clique sur l'élément ciblé
      completeStep(currentStep.id)
    }

    // Utiliser clickTarget si défini, sinon selector
    const targetSelector = currentStep.clickTarget || currentStep.selector

    // Petit délai pour s'assurer que l'élément est dans le DOM
    const timeout = setTimeout(() => {
      const targetElement = document.querySelector(targetSelector)
      if (targetElement) {
        targetElement.addEventListener('click', handleTargetClick)
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
      const targetElement = document.querySelector(targetSelector)
      if (targetElement) {
        targetElement.removeEventListener('click', handleTargetClick)
      }
    }
  }, [currentStep, enabled, completeStep])

  // Effet pour vérifier la condition continueCondition (bouton Suivant activé/désactivé)
  // + passage automatique à l'étape suivante quand la condition est remplie
  useEffect(() => {
    if (!currentStep || !enabled) {
      setCanContinue(true)
      return
    }

    // Cas spécial pour l'étape documents-template : vérifier si un template a été uploadé
    if (currentStep.id === 'documents-template') {
      const checkTemplateUploaded = () => {
        const element = document.querySelector('[data-tutorial="template-section"]')
        if (!element) {
          setCanContinue(false)
          return
        }
        const hasTemplate = element.getAttribute('data-has-template') === 'true'

        setCanContinue(hasTemplate)

        // Passage automatique à l'étape suivante si template uploadé (une seule fois)
        if (hasTemplate && !hasAutoAdvancedRef.current) {
          hasAutoAdvancedRef.current = true
          // Petit délai pour laisser l'UI se mettre à jour
          setTimeout(() => {
            goToNextStep()
          }, 800)
        }
      }

      // Par défaut, bloquer
      setCanContinue(false)

      // Vérifier immédiatement
      checkTemplateUploaded()

      // Vérifier après un délai pour laisser le DOM se charger
      const initialTimeout = setTimeout(checkTemplateUploaded, 200)

      // Observer les changements d'attribut sur l'élément
      let observer: MutationObserver | null = null
      const setupObserver = () => {
        const element = document.querySelector('[data-tutorial="template-section"]')
        if (element) {
          observer = new MutationObserver(checkTemplateUploaded)
          observer.observe(element, { attributes: true, attributeFilter: ['data-has-template'] })
        }
      }

      // Délai pour setup l'observer aussi
      const observerTimeout = setTimeout(setupObserver, 300)

      // Polling comme backup (toutes les 500ms)
      const pollingInterval = setInterval(checkTemplateUploaded, 500)

      return () => {
        clearTimeout(initialTimeout)
        clearTimeout(observerTimeout)
        clearInterval(pollingInterval)
        observer?.disconnect()
      }
    }

    // Pour les autres étapes avec continueCondition
    if (!currentStep.continueCondition) {
      setCanContinue(true)
      return
    }

    // Par défaut, bloquer si une condition est définie
    setCanContinue(false)

    const checkContinueCondition = () => {
      const element = document.querySelector(currentStep.continueCondition!.selector)
      if (!element) {
        setCanContinue(false)
        return
      }
      const attrValue = element.getAttribute(currentStep.continueCondition!.attribute)
      const conditionMet = attrValue === currentStep.continueCondition!.value
      setCanContinue(conditionMet)
    }

    // Vérifier immédiatement
    checkContinueCondition()

    // Vérifier après un délai pour laisser le DOM se charger
    const initialTimeout = setTimeout(checkContinueCondition, 200)

    // Observer les changements d'attribut sur l'élément
    let observer: MutationObserver | null = null
    const setupObserver = () => {
      const element = document.querySelector(currentStep.continueCondition!.selector)
      if (element) {
        observer = new MutationObserver(checkContinueCondition)
        observer.observe(element, { attributes: true, attributeFilter: [currentStep.continueCondition!.attribute] })
      }
    }

    // Délai pour setup l'observer aussi
    const observerTimeout = setTimeout(setupObserver, 300)

    return () => {
      clearTimeout(initialTimeout)
      clearTimeout(observerTimeout)
      observer?.disconnect()
    }
  }, [currentStep?.id, currentStep?.continueCondition, enabled, goToNextStep])

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 180 // Estimation
    const padding = 12
    const arrowOffset = 16

    let top = 0
    let left = 0
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top'

    const preferredPosition = currentStep?.position || 'bottom'

    switch (preferredPosition) {
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        arrowPosition = 'top'
        break
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        arrowPosition = 'bottom'
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - padding
        arrowPosition = 'right'
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding
        arrowPosition = 'left'
        break
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2
        left = window.innerWidth / 2 - tooltipWidth / 2
        arrowPosition = 'top'
        break
    }

    // Ajuster si hors écran
    if (left < padding) left = padding
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding
    }
    if (top < padding) top = padding
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding
    }

    setPosition({ top, left, arrowPosition })
    setIsVisible(true)

    // Scroll vers l'élément si nécessaire
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (!currentStep || !enabled || !isVisible || !position) {
    return null
  }

  const arrowClasses = {
    top: 'before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-white dark:before:border-b-gray-800',
    bottom: 'before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-white dark:before:border-t-gray-800',
    left: 'before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-2 before:border-8 before:border-transparent before:border-r-white dark:before:border-r-gray-800',
    right: 'before:absolute before:top-1/2 before:-translate-y-1/2 before:-right-2 before:border-8 before:border-transparent before:border-l-white dark:before:border-l-gray-800',
  }

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[100] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
        !isDragging && 'animate-in fade-in-0 zoom-in-95 duration-200',
        isDragging && 'cursor-grabbing',
        // Masquer la flèche si on a dragué
        dragOffset.x === 0 && dragOffset.y === 0 && arrowClasses[position.arrowPosition]
      )}
      style={{
        top: position.top + dragOffset.y,
        left: position.left + dragOffset.x,
      }}
    >
      {/* Header avec drag handle */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Déplacer"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {currentStep.globalOrder}
          </div>
          <span className="text-xs text-muted-foreground">
            / {progress.total}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setEnabled(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
          {currentStep.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {currentStep.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-muted-foreground hover:text-foreground"
          onClick={skipStep}
        >
          <SkipForward className="h-3 w-3 mr-1" />
          Passer
        </Button>
        <div className="flex items-center gap-1">
          {progress.completed > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {currentStep.action === 'click' ? (
            <div className="flex items-center gap-1.5 h-7 px-3 text-xs text-primary font-medium bg-primary/10 rounded-md">
              <MousePointerClick className="h-3 w-3" />
              Cliquez sur l'élément
            </div>
          ) : (currentStep.id === 'documents-template' || currentStep.continueCondition) && !canContinue ? (
            <div className="flex items-center gap-1.5 h-7 px-3 text-xs text-amber-600 font-medium bg-amber-50 rounded-md border border-amber-200">
              {currentStep.id === 'documents-template'
                ? 'Uploadez un template'
                : (currentStep.continueCondition?.hint || 'Action requise')}
            </div>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={goToNextStep}
              disabled={(currentStep.id === 'documents-template' || currentStep.continueCondition) ? !canContinue : false}
            >
              Suivant
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
