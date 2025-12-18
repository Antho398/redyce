/**
 * Page de consommation OpenAI dans les paramètres
 */

'use client'

import { UsageTrackerComponent } from '@/components/usage/UsageTracker'
import { useSession } from 'next-auth/react'
import { ProjectHeader } from '@/components/projects/ProjectHeader'

export default function ConsumptionPage() {
  const { data: session } = useSession()

  return (
    <>
      {/* Header - pleine largeur */}
      <div className="w-full mb-4">
        <ProjectHeader
          title="Consommation"
          subtitle="Suivez votre consommation et vos coûts d&apos;utilisation de l&apos;API OpenAI"
        />
      </div>
      
      {/* Contenu avec max-width */}
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <UsageTrackerComponent userId={session?.user?.id} />
      </div>
    </>
  )
}

