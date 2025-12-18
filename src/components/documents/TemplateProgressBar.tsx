/**
 * Barre de progression horizontale pour le flow template
 * Affiche les 3 étapes : Template importé → Questions extraites → Mémoire créé
 */
'use client'

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import Link from 'next/link'

type FlowState = 'NO_TEMPLATE' | 'UPLOADED' | 'PARSED' | 'MEMO_CREATED'

interface TemplateProgressBarProps {
  flowState: FlowState
  projectId: string
  templateId?: string
  questionsCount?: number
  sectionsCount?: number
  memoireId?: string
}

export function TemplateProgressBar({
  flowState,
  projectId,
  templateId,
  questionsCount = 0,
  sectionsCount = 0,
  memoireId,
}: TemplateProgressBarProps) {
  const steps = [
    {
      id: 'template',
      label: 'Template importé',
      isCompleted: flowState !== 'NO_TEMPLATE',
      isCurrent: flowState === 'NO_TEMPLATE',
      link: templateId ? `/projects/${projectId}/documents/${templateId}` : undefined,
    },
    {
      id: 'questions',
      label: 'Questions extraites',
      isCompleted: flowState === 'PARSED' || flowState === 'MEMO_CREATED',
      isCurrent: flowState === 'UPLOADED',
      sublabel: flowState === 'PARSED' || flowState === 'MEMO_CREATED' 
        ? `${sectionsCount} section${sectionsCount > 1 ? 's' : ''} · ${questionsCount} question${questionsCount > 1 ? 's' : ''}`
        : undefined,
      link: (flowState === 'PARSED' || flowState === 'MEMO_CREATED') ? `/projects/${projectId}/questions` : undefined,
    },
    {
      id: 'memoire',
      label: 'Mémoire créé',
      isCompleted: flowState === 'MEMO_CREATED',
      isCurrent: flowState === 'PARSED',
      link: memoireId ? `/projects/${projectId}/memoire/${memoireId}` : undefined,
    },
  ]

  return (
    <div className="w-full bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step */}
            <div className="flex items-center gap-3 flex-1">
              {/* Icon */}
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  step.isCompleted && 'bg-green-100',
                  step.isCurrent && !step.isCompleted && 'bg-blue-100',
                  !step.isCompleted && !step.isCurrent && 'bg-muted'
                )}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : step.isCurrent ? (
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Label */}
              <div className="min-w-0">
                {step.link ? (
                  <Link
                    href={step.link}
                    className={cn(
                      'text-sm font-medium hover:underline',
                      step.isCompleted && 'text-green-700',
                      step.isCurrent && !step.isCompleted && 'text-blue-700',
                      !step.isCompleted && !step.isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.isCompleted && '✓ '}
                    {step.isCurrent && !step.isCompleted && '→ '}
                    {step.label}
                  </Link>
                ) : (
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.isCompleted && 'text-green-700',
                      step.isCurrent && !step.isCompleted && 'text-blue-700',
                      !step.isCompleted && !step.isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.isCompleted && '✓ '}
                    {step.isCurrent && !step.isCompleted && '→ '}
                    {step.label}
                  </p>
                )}
                {step.sublabel && (
                  <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                )}
              </div>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0 mx-4">
                <ArrowRight
                  className={cn(
                    'h-4 w-4',
                    step.isCompleted ? 'text-green-400' : 'text-muted-foreground/40'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

