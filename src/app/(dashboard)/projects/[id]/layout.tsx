/**
 * Layout nested pour les pages d'un projet
 * Ajoute la barre d'onglets en haut du contenu
 */

'use client'

import { usePathname } from 'next/navigation'
import { ProjectTabs } from '@/components/navigation/ProjectTabs'
import { useMemo } from 'react'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Extraire l'ID du projet depuis le pathname
  const projectId = useMemo(() => {
    const match = pathname?.match(/^\/projects\/([^/]+)/)
    return match ? match[1] : ''
  }, [pathname])

  if (!projectId) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectTabs projectId={projectId} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

