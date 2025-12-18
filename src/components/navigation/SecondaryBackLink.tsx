/**
 * Composant de lien retour secondaire uniforme
 * Navigation discrète et élégante pour tous les liens "Retour" de l'application
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

interface SecondaryBackLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SecondaryBackLink({ href, children, className }: SecondaryBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        'transition-all duration-200',
        'hover:text-primary hover:underline',
        'hover:-translate-x-0.5',
        className
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </Link>
  )
}

