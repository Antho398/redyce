/**
 * Barre de progression pour l'extraction IA des informations entreprise
 * Affiche une progression simulée pendant ~45s d'extraction
 */
'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

interface ExtractionProgressBarProps {
  isExtracting: boolean
  className?: string
}

const EXTRACTION_STEPS = [
  { progress: 10, label: 'Lecture du document...' },
  { progress: 25, label: 'Analyse du contenu...' },
  { progress: 45, label: 'Identification des informations...' },
  { progress: 65, label: 'Extraction des données entreprise...' },
  { progress: 80, label: 'Structuration des résultats...' },
  { progress: 95, label: 'Finalisation...' },
]

export function ExtractionProgressBar({ isExtracting, className }: ExtractionProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isExtracting) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    // Progression sur ~45 secondes
    const totalDuration = 45000 // 45 secondes
    const stepDuration = totalDuration / EXTRACTION_STEPS.length

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < EXTRACTION_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, stepDuration)

    // Progression fluide
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const targetProgress = EXTRACTION_STEPS[currentStep]?.progress || 95
        if (prev < targetProgress) {
          return Math.min(prev + 1, targetProgress)
        }
        return prev
      })
    }, 200)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [isExtracting, currentStep])

  if (!isExtracting) return null

  const stepLabel = EXTRACTION_STEPS[currentStep]?.label || 'Extraction en cours...'

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header avec icône et label */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Extraction IA en cours</p>
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
            <p className="text-xs text-blue-700">{stepLabel}</p>
          </div>
        </div>
        <span className="text-sm font-medium text-blue-600">{progress}%</span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Estimation du temps */}
      <p className="text-xs text-blue-600 text-center">
        Temps estimé : ~45 secondes
      </p>
    </div>
  )
}
