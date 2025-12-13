/**
 * Page de gestion des documents d'un projet
 */

'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Rafraîchir la liste des documents après un upload réussi
    setRefreshKey((prev) => prev + 1)
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/projects/${projectId}/documents/${documentId}`)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au projet
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Documents du Projet</h1>
          <p className="text-muted-foreground mt-1">
            Uploadez et gérez vos documents (CCTP, DPGF, RC, CCAP, etc.)
          </p>
        </div>
      </div>

      {/* Section Upload - Pleine largeur en haut */}
      <div>
        <DocumentUpload
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Section Liste des documents - Pleine largeur en dessous */}
      <div>
        <DocumentList
          key={refreshKey}
          projectId={projectId}
          onDocumentClick={handleDocumentClick}
        />
      </div>
    </div>
  )
}

