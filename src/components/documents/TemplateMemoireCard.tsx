/**
 * Carte dédiée au Template mémoire (obligatoire)
 * Version simplifiée : statut + actions uniquement
 */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Upload, Sparkles, Eye, Loader2, X, FileText, AlertTriangle } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import Link from 'next/link'
import { cn } from '@/lib/utils/helpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TemplateMemoireCardProps {
  projectId: string
  template: any | null
  documents: Array<{
    id: string
    name: string
    mimeType?: string
    documentType?: string
  }>
  parsing: boolean
  onParseTemplate: () => Promise<void>
  onUploadComplete: (documentId?: string) => Promise<void> | void
  onCreateTemplate: (documentId: string) => Promise<void>
  onRemoveTemplate?: (documentId: string) => Promise<void>
}

export function TemplateMemoireCard({
  projectId,
  template,
  documents,
  parsing,
  onParseTemplate,
  onUploadComplete,
  onCreateTemplate,
  onRemoveTemplate,
}: TemplateMemoireCardProps) {
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toRemoveId, setToRemoveId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const templateDocuments = useMemo(
    () =>
      documents.filter(
        (doc) =>
          doc.documentType === 'MODELE_MEMOIRE' &&
          (doc.mimeType?.includes('pdf') || doc.mimeType?.includes('word') || doc.mimeType?.includes('msword'))
      ),
    [documents]
  )

  const templateName = template?.name || templateDocuments[0]?.name || 'Template mémoire'
  const hasTemplate = !!template || templateDocuments.length > 0

  // Détecter si le template actuel est un PDF
  const isPdfTemplate = useMemo(() => {
    if (template?.mimeType) {
      return template.mimeType.includes('pdf')
    }
    if (templateDocuments.length > 0) {
      const activeDoc = templateDocuments.find(doc => doc.id === template?.id) || templateDocuments[0]
      return activeDoc?.mimeType?.includes('pdf') || activeDoc?.name?.toLowerCase().endsWith('.pdf')
    }
    return false
  }, [template, templateDocuments])

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
        {/* En-tête */}
        <div className="bg-muted/50 border border-border rounded-md p-3">
          <div className="flex items-center gap-3">
            <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              <span>Template mémoire</span>
              {hasTemplate && (
                <Badge variant="success" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Défini
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Statut du template */}
        {hasTemplate && (
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{templateName}</span>
              {template?.status === 'PARSED' && (
                <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                  Parsé
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {template?.id && (
                <Link href={`/projects/${projectId}/documents/${template.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </Button>
                </Link>
              )}
              {template?.status === 'PARSED' && (
                <Link href={`/projects/${projectId}/questions`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Questions
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Alerte PDF */}
        {isPdfTemplate && hasTemplate && (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50/60 p-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">Template PDF détecté</p>
              <p className="text-xs text-amber-700 mt-0.5">
                L&apos;injection automatique du contenu ne sera pas possible. Privilégiez un fichier DOCX.
              </p>
            </div>
          </div>
        )}

        {/* Upload zone */}
        <div className="flex-1">
          <DocumentUpload
            projectId={projectId}
            documentType="MODELE_MEMOIRE"
            accept=".pdf,.doc,.docx"
            hideTypeSelector
            maxFiles={1}
            disabled={hasTemplate}
            onUploadComplete={onUploadComplete}
          />
        </div>

        {/* Liste des templates existants + Action */}
        {templateDocuments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {hasTemplate ? 'Changer de template' : 'Utiliser un document existant'}
            </p>
            
            <div className="flex items-center justify-between gap-3">
              {/* Templates à gauche */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {templateDocuments.map((doc) => {
                  const isActiveTemplate = hasTemplate && template?.id === doc.id
                  
                  return (
                    <div key={doc.id} className="flex items-center">
                      {/* Bouton de sélection du template */}
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-l-md text-xs font-medium transition-all duration-200 h-8 px-3 gap-2 shadow-sm",
                          !isActiveTemplate && "border border-r-0 border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
                          isActiveTemplate && "border border-r-0 border-accent bg-accent text-accent-foreground cursor-default",
                          !!selectingId && "cursor-default"
                        )}
                        disabled={!!selectingId || isActiveTemplate}
                        onClick={async () => {
                          if (isActiveTemplate || selectingId) return
                          setSelectingId(doc.id)
                          try {
                            await onCreateTemplate(doc.id)
                          } finally {
                            setSelectingId(null)
                          }
                        }}
                      >
                        {selectingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isActiveTemplate ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate max-w-[120px]">{doc.name}</span>
                      </button>
                      {/* Bouton de suppression séparé */}
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center justify-center rounded-r-md h-8 w-8 transition-all duration-200",
                          !isActiveTemplate && "border border-l-0 border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                          isActiveTemplate && "border border-l-0 border-accent bg-accent/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        )}
                        title="Supprimer ce template"
                        disabled={!!selectingId || !onRemoveTemplate}
                        onClick={() => {
                          setToRemoveId(doc.id)
                          setConfirmOpen(true)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Bouton Extraire à droite, aligné */}
              {hasTemplate && template?.status !== 'PARSED' && (
                <Button
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  disabled={parsing}
                  onClick={onParseTemplate}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extraction...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Extraire les questions
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Dialog de confirmation de suppression */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer ce template ?</DialogTitle>
              <DialogDescription>
                Le document sera retiré de la liste des templates.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={removing}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                disabled={removing || !toRemoveId}
                onClick={async () => {
                  if (!toRemoveId || !onRemoveTemplate) return
                  setRemoving(true)
                  try {
                    await onRemoveTemplate(toRemoveId)
                    setConfirmOpen(false)
                    setToRemoveId(null)
                  } finally {
                    setRemoving(false)
                  }
                }}
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
