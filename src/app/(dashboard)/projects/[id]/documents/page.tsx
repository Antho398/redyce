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
import { Input } from '@/components/ui/input'
import { FileText, Loader2, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplate } from '@/hooks/useTemplate'
import Link from 'next/link'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { Button } from '@/components/ui/button'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import { TemplateProgressBar } from '@/components/documents/TemplateProgressBar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  
  // Modal création mémoire pendant parsing
  const [showParsingModal, setShowParsingModal] = useState(false)
  const [parsingStep, setParsingStep] = useState<'extracting' | 'creating' | 'done'>('extracting')
  const [newMemoireTitle, setNewMemoireTitle] = useState('')
  const [createdMemoireId, setCreatedMemoireId] = useState<string | null>(null)

  // Filtrer les documents de contexte : exclure les templates mémoire
  const contextDocuments = documents.filter((doc) => {
    const docType = doc.documentType?.toUpperCase() || ''
    return docType !== 'MODELE_MEMOIRE'
  })

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
      // Ouvrir le modal et initialiser le titre
      setNewMemoireTitle(`Mémoire - ${template.name || 'v1'}`)
      setParsingStep('extracting')
      setCreatedMemoireId(null)
      setShowParsingModal(true)

      const response = await fetch('/api/memoire/template/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        await fetchTemplate()
        const nbSections = (data.data.metaJson as { nbSections?: number })?.nbSections || 0
        
        // Passer à l'étape de création du mémoire
        setParsingStep('creating')
        
        // Créer automatiquement le mémoire
        const memoireResponse = await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            templateDocumentId: template.id,
            title: newMemoireTitle || `Mémoire - ${template.name || 'v1'}`,
          }),
        })
        
        const memoireData = await memoireResponse.json()
        
        if (memoireData.success) {
          setCreatedMemoireId(memoireData.data.id)
          setParsingStep('done')
          toast.success('Extraction terminée', `${nbSections} sections extraites et mémoire créé.`)
        } else {
          // Le mémoire n'a pas pu être créé, mais le parsing a réussi
          setParsingStep('done')
          toast.success('Template parsé', `${nbSections} sections extraites. Créez un mémoire pour commencer.`)
        }
      } else {
        throw new Error(data.error?.message || 'Erreur lors du parsing')
      }
    } catch (err) {
      console.error('Parse template error:', err)
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de parser le template')
      setShowParsingModal(false)
    } finally {
      setParsing(false)
    }
  }
  
  const handleGoToQuestions = () => {
    setShowParsingModal(false)
    router.push(`/projects/${projectId}/questions`)
  }
  
  const handleGoToMemoire = () => {
    if (createdMemoireId) {
      setShowParsingModal(false)
      router.push(`/projects/${projectId}/memoire/${createdMemoireId}`)
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
    <div className="max-w-7xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Documents"
        subtitle="Gérer et importer vos documents sources (AO, DPGF, CCTP...)"
        primaryAction={
          template?.status === 'PARSED' && (
            <Link href={`/projects/${projectId}/questions`}>
              <Button size="sm" className="gap-2">
                Voir les questions extraites
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )
        }
      />

      {/* Bouton retour - sous le header avec espacement uniforme */}
      <div className="flex items-center justify-between mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
        >
          Retour au projet
        </HeaderLinkButton>
      </div>

      {/* Barre de progression horizontale - en premier */}
      <TemplateProgressBar
        flowState={
          !template ? 'NO_TEMPLATE' : 
          parsing ? 'PARSING' :
          template?.status === 'PARSED' ? 'PARSED' : 'UPLOADED'
        }
        projectId={projectId}
        templateId={template?.id}
        questionsCount={template?.questions?.length || 0}
        sectionsCount={template?.metaJson?.nbSections || 0}
      />

      {/* Grid 2 colonnes : Template mémoire + Documents de contexte (zones d'upload) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
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

      {/* Modal de parsing et création de mémoire */}
      <Dialog open={showParsingModal} onOpenChange={(open) => {
        // Ne pas permettre de fermer pendant le parsing
        if (!open && parsingStep === 'done') {
          setShowParsingModal(false)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {parsingStep === 'extracting' && 'Extraction des questions...'}
              {parsingStep === 'creating' && 'Création du mémoire...'}
              {parsingStep === 'done' && 'Extraction terminée !'}
            </DialogTitle>
            <DialogDescription>
              {parsingStep === 'extracting' && 'Analyse du template en cours. Définissez le titre de votre mémoire.'}
              {parsingStep === 'creating' && 'Les questions ont été extraites. Création du mémoire...'}
              {parsingStep === 'done' && 'Votre mémoire est prêt. Que souhaitez-vous faire ?'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Indicateur de progression */}
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                parsingStep === 'extracting' ? 'bg-primary/10' : 'bg-green-100'
              }`}>
                {parsingStep === 'extracting' ? (
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Extraction des questions</p>
                <p className="text-xs text-muted-foreground">
                  {parsingStep === 'extracting' ? 'En cours...' : 'Terminé'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                parsingStep === 'extracting' ? 'bg-muted' : 
                parsingStep === 'creating' ? 'bg-primary/10' : 'bg-green-100'
              }`}>
                {parsingStep === 'creating' ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : parsingStep === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Création du mémoire</p>
                <p className="text-xs text-muted-foreground">
                  {parsingStep === 'extracting' ? 'En attente' : 
                   parsingStep === 'creating' ? 'En cours...' : 
                   createdMemoireId ? 'Terminé' : 'Non créé'}
                </p>
              </div>
            </div>

            {/* Champ titre du mémoire */}
            <div className="space-y-2 pt-2">
              <label htmlFor="memoire-title" className="text-sm font-medium text-foreground">
                Titre du mémoire
              </label>
              <Input
                id="memoire-title"
                value={newMemoireTitle}
                onChange={(e) => setNewMemoireTitle(e.target.value)}
                placeholder="Mémoire - v1"
                disabled={parsingStep !== 'extracting'}
                className="w-full"
              />
              {parsingStep === 'extracting' && (
                <p className="text-xs text-muted-foreground">
                  Modifiez le titre pendant l&apos;extraction
                </p>
              )}
            </div>
          </div>
          
          {parsingStep === 'done' && (
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleGoToQuestions}>
                Voir les questions
              </Button>
              {createdMemoireId && (
                <Button onClick={handleGoToMemoire}>
                  Aller au mémoire
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
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
