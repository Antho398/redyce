/**
 * Composant PageHeader - En-tête standardisé pour les pages
 * Utilise le design system Redyce
 */

import * as React from 'react'
import { cn } from '@/lib/utils/helpers'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4 flex items-start justify-between', className)} // mb-4 (compact)
        {...props}
      >
      <div className="flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1> {/* text-2xl (compact) */}
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> {/* text-sm, pas font-medium */}
        )}
      </div>
        {actions && (
          <div className="ml-4 flex items-center gap-2">{actions}</div>
        )}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }

