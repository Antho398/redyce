/**
 * Stepper de progression pour le flow template
 * Affiche les 4 étapes : Template importé → Questions extraites → Mémoire créé → Export
 * Design : icônes métier + badge check pour validation
 * 
 * États visuels :
 * - Gris : étape non encore traitée
 * - Bleu : étape en cours de traitement
 * - Vert + check : étape terminée
 */
'use client'

import { FileText, HelpCircle, FileEdit, Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import Link from 'next/link'

type FlowState = 'NO_TEMPLATE' | 'UPLOADED' | 'PARSING' | 'PARSED' | 'MEMO_CREATED' | 'EXPORTED'

interface TemplateProgressBarProps {
  flowState: FlowState
  projectId: string
  templateId?: string
  questionsCount?: number
  sectionsCount?: number
  memoireId?: string
  isExporting?: boolean
}

export function TemplateProgressBar({
  flowState,
  projectId,
  templateId,
  questionsCount = 0,
  sectionsCount = 0,
  memoireId,
  isExporting = false,
}: TemplateProgressBarProps) {
  // Définir les états de chaque étape
  const getStepState = (stepId: string): 'completed' | 'active' | 'pending' => {
    switch (stepId) {
      case 'template':
        if (flowState === 'NO_TEMPLATE') return 'pending'
        return 'completed'
      
      case 'questions':
        if (flowState === 'NO_TEMPLATE' || flowState === 'UPLOADED') return 'pending'
        if (flowState === 'PARSING') return 'active'
        return 'completed'
      
      case 'memoire':
        if (['NO_TEMPLATE', 'UPLOADED', 'PARSING', 'PARSED'].includes(flowState) && !memoireId) return 'pending'
        if (flowState === 'PARSED' && !memoireId) return 'active'
        return memoireId ? 'completed' : 'pending'
      
      case 'export':
        if (isExporting) return 'active'
        if (flowState === 'EXPORTED') return 'completed'
        return 'pending'
      
      default:
        return 'pending'
    }
  }

  const steps = [
    {
      id: 'template',
      label: 'Template importé',
      icon: FileText,
      state: getStepState('template'),
      link: templateId ? `/projects/${projectId}/documents/${templateId}` : undefined,
    },
    {
      id: 'questions',
      label: 'Questions extraites',
      icon: HelpCircle,
      state: getStepState('questions'),
      sublabel: getStepState('questions') === 'completed'
        ? `${sectionsCount} section${sectionsCount > 1 ? 's' : ''} · ${questionsCount} question${questionsCount > 1 ? 's' : ''}`
        : undefined,
      link: getStepState('questions') === 'completed' ? `/projects/${projectId}/questions` : undefined,
    },
    {
      id: 'memoire',
      label: 'Mémoire créé',
      icon: FileEdit,
      state: getStepState('memoire'),
      link: memoireId ? `/projects/${projectId}/memoire/${memoireId}` : undefined,
    },
    {
      id: 'export',
      label: 'Export du mémoire',
      icon: Download,
      state: getStepState('export'),
    },
  ]

  return (
    <div className="w-full bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step) => {
          const Icon = step.icon
          const isCompleted = step.state === 'completed'
          const isActive = step.state === 'active'
          const isPending = step.state === 'pending'
          
          return (
            <div key={step.id} className="flex items-center gap-2.5 flex-1">
              {/* Icône avec badge de validation */}
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center transition-colors',
                    isCompleted && 'bg-green-50',
                    isActive && 'bg-blue-100',
                    isPending && 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 transition-colors',
                      isCompleted && 'text-green-700',
                      isActive && 'text-blue-600',
                      isPending && 'text-muted-foreground'
                    )}
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>
                {/* Badge check pour étape terminée */}
                {isCompleted && (
                  <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-700 flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="min-w-0 flex-1">
                {step.link ? (
                  <Link
                    href={step.link}
                    className={cn(
                      'text-sm font-medium hover:underline block',
                      isCompleted && 'text-green-700',
                      isActive && 'text-blue-700',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </Link>
                ) : (
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-green-700',
                      isActive && 'text-blue-700',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                )}
                {step.sublabel && (
                  <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
