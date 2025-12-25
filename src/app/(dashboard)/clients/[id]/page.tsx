/**
 * Page de détail d'un client
 * Redirige vers la liste des projets du client
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la liste des projets du client
    router.replace(`/clients/${params.id}/projects`)
  }, [router, params.id])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Redirection...</p>
      </div>
    </div>
  )
}
