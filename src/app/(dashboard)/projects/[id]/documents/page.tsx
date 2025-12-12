/**
 * Page de gestion des documents d'un projet
 */

'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Rafraîchir la liste des documents
    setRefreshKey((prev) => prev + 1)
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/projects/${params.id}/documents/${documentId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Documents du Projet</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les documents de votre projet
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <DocumentUpload
            projectId={params.id}
            onUploadComplete={handleUploadComplete}
          />
        </div>
        <div>
          <DocumentList
            key={refreshKey}
            projectId={params.id}
            onDocumentClick={handleDocumentClick}
          />
        </div>
      </div>
    </div>
  )
}

