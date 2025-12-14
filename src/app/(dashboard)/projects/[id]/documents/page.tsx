/**
 * Page de gestion des documents d'un projet - Design System Redyce V1
 * Style compact, professionnel, dense
 */

'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { TemplateCard } from '@/components/documents/TemplateCard'
import { TemplateWarningCard } from '@/components/documents/TemplateWarningCard'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplate } from '@/hooks/useTemplate'

export default function ProjectDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const { documents, loading, error, fetchDocuments } = useDocuments(projectId)
  const { template, fetchTemplate } = useTemplate(projectId)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  const handleUploadComplete = () => {
    fetchDocuments()
    fetchTemplate()
  }

  const handleCreateTemplate = async (documentId: string) => {
    try {
      const response = await fetch('/api/memoire/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, documentId }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTemplate()
        toast.success('Template créé', 'Le template mémoire a été créé. Vous pouvez maintenant le parser.')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création du template')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de créer le template')
    }
  }

  const handleParseTemplate = async () => {
    if (!template) return

    try {
      setParsing(true)
      const response = await fetch('/api/memoire/template/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTemplate()
        toast.success('Template parsé', `Les sections ont été extraites avec succès (${(data.data.metaJson as { nbSections?: number })?.nbSections || 0} sections).`)
        setTimeout(() => {
          router.push(`/projects/${projectId}/memoire`)
        }, 1500)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du parsing')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de parser le template')
    } finally {
      setParsing(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      setDeletingId(documentId)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Document supprimé', 'Le document a été supprimé avec succès')
        fetchDocuments()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer le document')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3 py-4">
      {/* Header compact */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 via-accent/10 to-[#F8D347]/25 rounded-lg p-3 -mx-4 px-4">
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérer et importer vos documents sources (AO, DPGF, CCTP)
        </p>
      </div>

      {/* Bloc template mémoire obligatoire */}
      {!template && (
        <TemplateWarningCard
          documents={documents}
          onCreateTemplate={handleCreateTemplate}
        />
      )}

      {/* Template parsé ou en cours */}
      {template && (
        <TemplateCard
          template={template}
          projectId={projectId}
          onParse={handleParseTemplate}
          parsing={parsing}
        />
      )}

      {/* Zone upload compacte */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Importer des documents</p>
              <p className="text-xs text-muted-foreground">
                Formats supportés : PDF, DOCX, JPEG, PNG, GIF • Taille max : 50 Mo
              </p>
            </div>
          </div>
          <DocumentUpload
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Liste en table */}
      {error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
            <p className="text-sm text-destructive font-medium mb-4">{error}</p>
            <Button onClick={fetchDocuments} variant="outline" size="sm">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <EmptyDocumentsState projectId={projectId} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DocumentsTable
              documents={documents}
              projectId={projectId}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyDocumentsState({ projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Card className="w-full max-w-md bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
        <CardContent className="flex flex-col items-center text-center py-8 px-4">
          <div className="mb-4">
            <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun document
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Importez des documents techniques (PDF, DOCX, images) pour les analyser et extraire des données.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
