/**
 * Page de gestion des documents d'un projet - Design System Redyce V1
 * Style compact, professionnel, dense
 */

'use client'

import { useState } from 'react'
import { TemplateMemoireCard } from '@/components/documents/TemplateMemoireCard'
import { ProjectDocumentsCard } from '@/components/documents/ProjectDocumentsCard'
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [parsing, setParsing] = useState(false)
  const [pendingFilesCount, setPendingFilesCount] = useState(0)

  const contextDocuments = documents.filter((doc) => doc.documentType !== 'MODELE_MEMOIRE')

  const handleUploadComplete = async (documentId?: string) => {
    // Recharger les documents pour avoir les dernières données
    await fetchDocuments()
    
    // Si un document de type MODELE_MEMOIRE vient d'être uploadé, créer automatiquement le template
    if (documentId) {
      // Recharger les documents pour obtenir les données à jour
      const response = await fetch(`/api/projects/${projectId}/documents`)
      const data = await response.json()
      const updatedDocs = data.data || []
      const uploadedDoc = updatedDocs.find((doc: any) => doc.id === documentId)
      
      if (uploadedDoc && uploadedDoc.documentType === 'MODELE_MEMOIRE') {
        try {
          await handleCreateTemplate(documentId)
          // Ne pas afficher de toast ici car handleCreateTemplate le fait déjà
        } catch (err) {
          // Ignorer si le template existe déjà ou autre erreur non bloquante
          if (err instanceof Error && !err.message.includes('déjà') && !err.message.includes('already')) {
            console.error('Erreur lors de la création automatique du template:', err)
          }
        }
      }
    }
    
    await fetchTemplate()
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
        // Rafraîchir à la fois le template ET les documents pour que la liste soit à jour
        await Promise.all([fetchTemplate(), fetchDocuments()])
        toast.success('Template défini', 'Le template mémoire a été défini. Vous pouvez maintenant extraire les questions.')
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
        const nbSections = (data.data.metaJson as { nbSections?: number })?.nbSections || 0
        toast.success('Template parsé', `Les sections ont été extraites avec succès (${nbSections} sections).`)
        // Rediriger vers la page des questions extraites pour review
        setTimeout(() => {
          router.push(`/projects/${projectId}/questions`)
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

  const handleRemoveTemplate = async (documentId: string) => {
    try {
      const response = await fetch(`/api/memoire/template?projectId=${projectId}&documentId=${documentId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplate()
        await fetchDocuments()
        toast.success('Template retiré', 'Le document a été retiré de la liste des templates.')
      } else {
        throw new Error(data.error?.message || 'Erreur lors du retrait du template')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de retirer le template')
    }
  }

  const handleDeleteClick = (documentId: string, documentName: string) => {
    setDocumentToDelete({ id: documentId, name: documentName })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      setDeletingId(documentToDelete.id)
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Document supprimé', 'Le document a été supprimé avec succès')
        await fetchDocuments()
        setDocumentToDelete(null)
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
    <div className="max-w-7xl mx-auto space-y-4 py-4">
      {/* Header compact */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 via-accent/10 to-[#F8D347]/25 rounded-lg p-3 -mx-4 px-4 pl-8">
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérer et importer vos documents sources (AO, DPGF, CCTP...)
        </p>
      </div>

      {/* Grid 2 colonnes : Template mémoire + Documents de contexte (zones d'upload) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Colonne gauche — Template mémoire */}
        <TemplateMemoireCard
          projectId={projectId}
          template={template}
          documents={documents}
          parsing={parsing}
          onParseTemplate={handleParseTemplate}
          onUploadComplete={handleUploadComplete}
          onCreateTemplate={handleCreateTemplate}
          onRemoveTemplate={handleRemoveTemplate}
        />

        {/* Colonne droite — Documents de contexte (upload uniquement) */}
        <ProjectDocumentsCard
          projectId={projectId}
          documents={[]}
          deletingId={null}
          error={error}
          pendingFilesCount={pendingFilesCount}
          onUploadComplete={handleUploadComplete}
          onDelete={handleDeleteClick}
          onPendingFilesChange={setPendingFilesCount}
          onRetry={fetchDocuments}
          showTable={false}
        />
      </div>

      {/* Section Documents de contexte chargés (pleine largeur en dessous) */}
      {contextDocuments.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Documents de contexte chargés</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {contextDocuments.length} document{contextDocuments.length > 1 ? 's' : ''} importé{contextDocuments.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <DocumentsTable
              documents={contextDocuments}
              projectId={projectId}
              onDelete={handleDeleteClick}
              deletingId={deletingId}
              onUpdate={fetchDocuments}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal de suppression de document */}
      <DeleteDocumentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documentName={documentToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        deleting={!!deletingId}
      />
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
