/**
 * Composant Spotlight pour le tutoriel
 * Style avec overlay sombre et mise en lumière de l'élément ciblé
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft, SkipForward, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTutorial } from '@/contexts/TutorialContext'
import { cn } from '@/lib/utils/helpers'

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface TooltipPosition {
  top: number
  left: number
}

export function TutorialSpotlight() {
  const { currentStep, enabled, progress, goToNextStep, goToPreviousStep, skipStep, setEnabled, completeStep } = useTutorial()
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  // Par défaut true, sera mis à false si une continueCondition est définie
  const [canContinue, setCanContinue] = useState(true)

  useEffect(() => {
    if (!currentStep || !enabled) {
      setIsVisible(false)
      return
    }

    // Trouver l'élément cible
    const targetElement = document.querySelector(currentStep.selector)
    if (!targetElement) {
      // Si l'élément n'est pas trouvé, afficher au centre
      if (currentStep.position === 'center') {
        setHighlightRect(null)
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 180,
        })
        setIsVisible(true)
      } else {
        // Attendre un peu et réessayer
        const timeout = setTimeout(() => {
          const retryElement = document.querySelector(currentStep.selector)
          if (retryElement) {
            calculatePositions(retryElement as HTMLElement)
          }
        }, 500)
        return () => clearTimeout(timeout)
      }
      return
    }

    calculatePositions(targetElement as HTMLElement)

    // Observer les changements
    const resizeObserver = new ResizeObserver(() => {
      const element = document.querySelector(currentStep.selector)
      if (element) {
        calculatePositions(element as HTMLElement)
      }
    })

    resizeObserver.observe(targetElement)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    function handleScroll() {
      if (!currentStep) return
      const element = document.querySelector(currentStep.selector)
      if (element) {
        calculatePositions(element as HTMLElement)
      }
    }

    function handleResize() {
      if (!currentStep) return
      const element = document.querySelector(currentStep.selector)
      if (element) {
        calculatePositions(element as HTMLElement)
      }
    }

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [currentStep, enabled])

  // Effet pour détecter le clic sur l'élément ciblé (pour les étapes action: 'click')
  useEffect(() => {
    if (!currentStep || !enabled || currentStep.action !== 'click') {
      return
    }

    const handleTargetClick = () => {
      console.log('[Tutorial] Click detected on target for step:', currentStep.id)
      completeStep(currentStep.id)
    }

    // Utiliser clickTarget si défini, sinon selector
    // Support pour plusieurs sélecteurs séparés par des virgules
    const targetSelector = currentStep.clickTarget || currentStep.selector
    const selectors = targetSelector.split(',').map(s => s.trim())

    console.log('[Tutorial] Setting up click listeners for step:', currentStep.id, 'selectors:', selectors)

    // Ajouter les listeners immédiatement (pas de délai)
    selectors.forEach(selector => {
      const targetElements = document.querySelectorAll(selector)
      console.log('[Tutorial] Found', targetElements.length, 'elements for selector:', selector)
      targetElements.forEach(el => {
        el.addEventListener('click', handleTargetClick)
      })
    })

    return () => {
      selectors.forEach(selector => {
        const targetElements = document.querySelectorAll(selector)
        targetElements.forEach(el => {
          el.removeEventListener('click', handleTargetClick)
        })
      })
    }
  }, [currentStep, enabled, completeStep])

  // Effet pour vérifier la condition continueCondition (bouton Continuer activé/désactivé)
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

      return () => {
        clearTimeout(initialTimeout)
        clearTimeout(observerTimeout)
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
  }, [currentStep?.id, currentStep?.continueCondition, enabled])

  const calculatePositions = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const padding = currentStep?.highlightPadding ?? 8

    // Rectangle de mise en lumière
    setHighlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })

    // Position du tooltip
    const tooltipWidth = 360
    const tooltipHeight = 200
    const gap = 16

    let top = 0
    let left = 0

    const preferredPosition = currentStep?.position || 'bottom'

    switch (preferredPosition) {
      case 'bottom':
        top = rect.bottom + padding + gap
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = rect.top - padding - gap - tooltipHeight
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - padding - gap - tooltipWidth
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding + gap
        break
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2
        left = window.innerWidth / 2 - tooltipWidth / 2
        break
    }

    // Ajuster si hors écran
    if (left < 16) left = 16
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16
    }
    if (top < 16) top = 16
    if (top + tooltipHeight > window.innerHeight - 16) {
      top = window.innerHeight - tooltipHeight - 16
    }

    // Appliquer l'offset vertical si défini
    if (currentStep?.offsetY) {
      top += currentStep.offsetY
    }

    setTooltipPosition({ top, left })
    setIsVisible(true)

    // Scroll vers l'élément si nécessaire
    if (currentStep?.position !== 'center') {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (!currentStep || !enabled || !isVisible) {
    return null
  }

  return createPortal(
    <>
      {/* Overlay avec 4 zones autour du spotlight (permet l'interaction avec le formulaire) */}
      {highlightRect ? (
        <div className="fixed inset-0 z-[90] pointer-events-none">
          {/* Zone du haut */}
          <div
            className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-auto cursor-pointer"
            style={{ height: highlightRect.top }}
            onClick={() => setEnabled(false)}
          />
          {/* Zone du bas */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-auto cursor-pointer"
            style={{ top: highlightRect.top + highlightRect.height }}
            onClick={() => setEnabled(false)}
          />
          {/* Zone de gauche */}
          <div
            className="absolute left-0 bg-black/60 pointer-events-auto cursor-pointer"
            style={{
              top: highlightRect.top,
              width: highlightRect.left,
              height: highlightRect.height,
            }}
            onClick={() => setEnabled(false)}
          />
          {/* Zone de droite */}
          <div
            className="absolute right-0 bg-black/60 pointer-events-auto cursor-pointer"
            style={{
              top: highlightRect.top,
              left: highlightRect.left + highlightRect.width,
              height: highlightRect.height,
            }}
            onClick={() => setEnabled(false)}
          />

          {/* Bordure autour de l'élément ciblé */}
          <div
            className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
            }}
          />
        </div>
      ) : (
        /* Overlay complet si pas de spotlight (position: center) */
        <div
          className="fixed inset-0 z-[90] bg-black/60 pointer-events-auto cursor-pointer"
          onClick={() => setEnabled(false)}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          className={cn(
            'fixed z-[100] w-[360px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-300'
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            pointerEvents: 'auto',
          }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                // Pour les étapes conditionnelles (7.5), utiliser la valeur entière (7)
                width: `${(Math.floor(currentStep.globalOrder) / progress.total) * 100}%`
              }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                {/* Afficher "7b", "7c" etc. pour les étapes conditionnelles (globalOrder non entier) */}
                {Number.isInteger(currentStep.globalOrder)
                  ? currentStep.globalOrder
                  : (() => {
                      const base = Math.floor(currentStep.globalOrder)
                      const decimal = Math.round((currentStep.globalOrder - base) * 10) // 5 pour 0.5, 6 pour 0.6
                      // 5 = b, 6 = c, 7 = d, etc.
                      const letter = String.fromCharCode(97 + decimal - 4) // 'b' pour 5, 'c' pour 6
                      return `${base}${letter}`
                    })()}
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                / {progress.total}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setEnabled(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
              {currentStep.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {currentStep.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={skipStep}
            >
              <SkipForward className="h-4 w-4 mr-1.5" />
              Passer
            </Button>
            <div className="flex items-center gap-2">
              {progress.completed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={goToPreviousStep}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {currentStep.action === 'click' ? (
                <div className="flex items-center gap-2 h-9 px-4 text-sm text-primary font-medium bg-primary/10 rounded-md">
                  <MousePointerClick className="h-4 w-4" />
                  Cliquez sur l'élément
                </div>
              ) : (currentStep.id === 'documents-template' || (currentStep.continueCondition?.hint)) && !canContinue ? (
                <div className="flex items-center gap-2 h-9 px-4 text-sm text-amber-600 font-medium bg-amber-50 rounded-md border border-amber-200">
                  {currentStep.id === 'documents-template'
                    ? 'Uploadez un template pour continuer'
                    : currentStep.continueCondition?.hint}
                </div>
              ) : (
                <Button
                  size="sm"
                  className="h-9 px-4"
                  onClick={goToNextStep}
                  disabled={(currentStep.id === 'documents-template' || currentStep.continueCondition) ? !canContinue : false}
                >
                  Continuer
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
