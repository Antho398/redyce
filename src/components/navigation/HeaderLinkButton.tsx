/**
 * Composant de bouton/lien uniforme pour les headers
 * Utilisé pour "Retour", "Retour aux questions extraites", "Informations de l'entreprise", etc.
 * Style cohérent : h-9, text-sm, gap-2, variant ghost/secondary
 */

import Link from 'next/link'
import { cn } from '@/lib/utils/helpers'
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface HeaderLinkButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  variant?: 'ghost' | 'secondary' | 'outline' | 'destructive-outline'
  className?: string
  disabled?: boolean
  title?: string
}

const baseStyles = 'inline-flex items-center justify-center h-9 px-3 text-sm font-medium rounded-md transition-all duration-200 gap-2 whitespace-nowrap'

const variantStyles = {
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  'destructive-outline': 'border border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50',
}

export function HeaderLinkButton({
  href,
  onClick,
  children,
  icon,
  iconPosition = 'left',
  variant = 'ghost',
  className,
  disabled = false,
  title,
}: HeaderLinkButtonProps) {
  const content = (
    <>
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </>
  )

  const combinedClassName = cn(
    baseStyles,
    variantStyles[variant],
    disabled && 'opacity-50 pointer-events-none',
    className
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName} title={title}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      title={title}
    >
      {content}
    </button>
  )
}

