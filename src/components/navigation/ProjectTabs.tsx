/**
 * Composant de navigation par onglets pour un projet
 * Design compact, professionnel - Redyce V1
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import { LayoutDashboard, FileText, FileEdit, Download, ListChecks } from 'lucide-react'

interface ProjectTab {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProjectTabsProps {
  projectId: string
}

const tabs: ProjectTab[] = [
  {
    id: 'overview',
    label: 'Aperçu',
    href: '/projects/[id]',
    icon: LayoutDashboard,
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/projects/[id]/documents',
    icon: FileText,
  },
  {
    id: 'memoire',
    label: 'Mémoire technique',
    href: '/projects/[id]/memoire',
    icon: FileEdit,
  },
  {
    id: 'exigences',
    label: 'Exigences',
    href: '/projects/[id]/exigences',
    icon: ListChecks,
  },
  {
    id: 'exports',
    label: 'Exports',
    href: '/projects/[id]/exports',
    icon: Download,
  },
]

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname()

  return (
    <div className="border-b bg-background -mt-2">
      <div className="px-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const href = tab.href.replace('[id]', projectId)
            
            // Déterminer si l'onglet est actif
            const isActive =
              tab.id === 'overview'
                ? pathname === `/projects/${projectId}` || pathname === `/projects/${projectId}/`
                : pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={tab.id}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

