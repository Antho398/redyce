/**
 * Composant de navigation par onglets pour les paramètres
 * Design compact, professionnel - Redyce V1
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import { Building2, BarChart3, Palette } from 'lucide-react'

interface SettingsTab {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: SettingsTab[] = [
  {
    id: 'company-profile',
    label: 'Profil entreprise',
    href: '/settings/company-profile',
    icon: Building2,
  },
  {
    id: 'interface',
    label: 'Interface',
    href: '/settings/interface',
    icon: Palette,
  },
  {
    id: 'consumption',
    label: 'Consommation OpenAI',
    href: '/settings/consumption',
    icon: BarChart3,
  },
]

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-background">
      <div className="px-6 pt-2">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/')

            return (
              <Link
                key={tab.id}
                href={tab.href}
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

