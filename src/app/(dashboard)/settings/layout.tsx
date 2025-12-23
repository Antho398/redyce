/**
 * Layout pour les pages de paramètres
 * Ajoute la barre d'onglets en haut du contenu
 */

'use client'

import { SettingsTabs } from '@/components/navigation/SettingsTabs'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      <SettingsTabs />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

