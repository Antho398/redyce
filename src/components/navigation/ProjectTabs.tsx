/**
 * Composant de navigation par onglets pour un projet
 * Design compact, professionnel - Redyce V1
 * 
 * Structure :
 * - "Aperçu" : Dashboard du projet (hors flow, séparé visuellement)
 * - Flow linéaire : Documents → Questions extraites → Mémoire technique → Exports
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import { LayoutDashboard, FileText, FileEdit, Download, HelpCircle, ChevronRight } from 'lucide-react'

interface ProjectTab {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProjectTabsProps {
  projectId: string
}

// Onglet "Aperçu" (hors flow)
const overviewTab: ProjectTab = {
  id: 'overview',
  label: 'Aperçu',
  href: '/projects/[id]',
  icon: LayoutDashboard,
}

// Flow linéaire principal
const flowTabs: ProjectTab[] = [
  {
    id: 'documents',
    label: 'Documents',
    href: '/projects/[id]/documents',
    icon: FileText,
  },
  {
    id: 'questions',
    label: 'Questions extraites',
    href: '/projects/[id]/questions',
    icon: HelpCircle,
  },
  {
    id: 'memoire',
    label: 'Mémoire technique',
    href: '/projects/[id]/memoire',
    icon: FileEdit,
  },
  {
    id: 'exports',
    label: 'Exports',
    href: '/projects/[id]/exports',
    icon: Download,
  },
]

// Autres pages (hors flow principal) - retirées de la navigation principale
// Les exigences sont accessibles depuis la page Mémoire technique

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname()

  const isTabActive = (tab: ProjectTab): boolean => {
    const href = tab.href.replace('[id]', projectId)
    
    if (tab.id === 'overview') {
      return pathname === `/projects/${projectId}` || pathname === `/projects/${projectId}/`
    }
    
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderTab = (tab: ProjectTab, variant: 'overview' | 'flow' | 'other' = 'flow') => {
    const Icon = tab.icon
    const href = tab.href.replace('[id]', projectId)
    const isActive = isTabActive(tab)

    return (
      <Link
        key={tab.id}
        href={href}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border-b-2',
          variant === 'overview' && 'text-muted-foreground',
          isActive
            ? variant === 'overview'
              ? 'border-primary/60 text-primary'
              : 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{tab.label}</span>
      </Link>
    )
  }

  return (
    <div className="border-b bg-background -mt-2">
      <div className="px-6">
        <nav className="flex items-center -mb-px">
          {/* Aperçu - séparé visuellement (hors flow) */}
          <div className="flex items-center">
            {renderTab(overviewTab, 'overview')}
          </div>
          
          {/* Séparateur visuel */}
          <div className="h-6 w-px bg-border mx-3" />
          
          {/* Flow linéaire principal */}
          <div className="flex items-center gap-0">
            {flowTabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                {renderTab(tab, 'flow')}
                {/* Flèche entre les étapes du flow (sauf la dernière) */}
                {index < flowTabs.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-0.5 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

