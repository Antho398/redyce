/**
 * Page de redirection intelligente vers le mémoire technique associé au template
 * Fait partie du flow principal : Documents → Questions → Mémoire → Exports
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function MemoireRedirectPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id

  useEffect(() => {
    const redirectToMemoire = async () => {
      try {
        // Récupérer le template mémoire actuel
        const templateResponse = await fetch(`/api/memoire/template?projectId=${projectId}`)
        const templateData = await templateResponse.json()

        if (!templateData.success || !templateData.data) {
          // Pas de template : rediriger vers Questions (qui redirigera vers Documents)
          router.push(`/projects/${projectId}/questions`)
          return
        }

        const templateId = templateData.data.id

        // Récupérer les mémoires du projet
        const memosResponse = await fetch(`/api/memos?projectId=${projectId}`)
        const memosData = await memosResponse.json()

        if (memosData.success && memosData.data) {
          // Trouver le mémoire associé au template courant
          const associatedMemoire = memosData.data.find(
            (m: any) => m.templateDocumentId === templateId
          )

          if (associatedMemoire) {
            // Rediriger vers le mémoire associé
            router.push(`/projects/${projectId}/memoire/${associatedMemoire.id}`)
          } else {
            // Aucun mémoire associé : rediriger vers Questions où on peut en créer un
            router.push(`/projects/${projectId}/questions`)
          }
        } else {
          // Erreur : rediriger vers Questions
          router.push(`/projects/${projectId}/questions`)
        }
      } catch (err) {
        console.error('Error redirecting to memoire:', err)
        // En cas d'erreur : rediriger vers Questions
        router.push(`/projects/${projectId}/questions`)
      }
    }

    redirectToMemoire()
  }, [projectId, router])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Redirection vers le mémoire technique...</p>
      </div>
    </div>
  )
}
