/**
 * Page de consommation OpenAI
 */

'use client'

import { UsageTrackerComponent } from '@/components/usage/UsageTracker'
import { useSession } from 'next-auth/react'

export default function ConsumptionPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Consommation OpenAI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivez votre consommation et vos coûts d&apos;utilisation de l&apos;API OpenAI
        </p>
      </div>
      <UsageTrackerComponent userId={session?.user?.id} />
    </div>
  )
}

