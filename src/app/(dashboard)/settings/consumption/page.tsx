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
      {/* Header */}
      <ProjectHeader
        title="Consommation"
        subtitle="Suivez votre consommation et vos coûts d'utilisation de l'API OpenAI"
      />

      {/* Contenu */}
      <UsageTrackerComponent userId={session?.user?.id} />
    </>
  )
}

