/**
 * Composant header uniforme pour toutes les pages projet
 * Garantit un positionnement cohérent du header avec gradient
 */

import { ReactNode } from 'react'

interface ProjectHeaderProps {
  title: string
  subtitle?: string | ReactNode
  primaryAction?: ReactNode
  dataTutorial?: string
}

export function ProjectHeader({ title, subtitle, primaryAction, dataTutorial }: ProjectHeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 bg-gradient-header rounded-lg p-3"
      data-tutorial={dataTutorial}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          ) : (
            <div className="mt-1">{subtitle}</div>
          )
        )}
      </div>
      {primaryAction && <div className="flex-shrink-0">{primaryAction}</div>}
    </div>
  )
}

