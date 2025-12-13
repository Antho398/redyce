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
        className={cn('mb-6 flex items-start justify-between', className)}
        {...props}
      >
      <div className="flex-1">
        <h1 className="text-4xl font-bold tracking-tight text-[#151959]">{title}</h1>
        {description && (
          <p className="mt-2.5 text-sm text-[#64748b] font-medium">{description}</p>
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

