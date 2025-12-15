/**
 * Carte dédiée au Template mémoire (obligatoire)
 * - Sépare clairement le flux template du reste des documents AO
 * - Affiche un état warning si absent, succès si présent
 */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, Upload, Sparkles, Eye, Loader2, X, FileText } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import Link from 'next/link'
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
  const [showReplace, setShowReplace] = useState(false)
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

  const templateName = template?.document?.name || template?.name || 'Template mémoire'
  const hasTemplate = !!template

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
        {/* En-tête uniformisé */}
        <div className="bg-muted/50 border border-border rounded-md p-3">
          <div className="flex items-center gap-3">
            <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Template mémoire (obligatoire)
              {hasTemplate && (
                <Badge variant="success" className="text-xs gap-1 ml-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Défini
                </Badge>
              )}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Document vierge contenant les questions à remplir (DOCX ou PDF)
        </p>

        {/* Boutons actions si template défini */}
        {hasTemplate && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={() => setShowReplace((prev) => !prev)}
            >
              <Upload className="h-4 w-4" />
              Remplacer
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={parsing || template?.status === 'PARSING'}
              onClick={onParseTemplate}
            >
              {parsing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extraire les questions
                </>
              )}
            </Button>
          </div>
        )}

        {/* Warning si pas de template */}
        {!hasTemplate && (
          <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50/60 p-3 min-h-[88px]">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Template mémoire requis</p>
              <p className="text-xs text-muted-foreground">
                Vous devez uploader un template mémoire (DOCX ou PDF) pour pouvoir générer votre mémoire technique.
              </p>
            </div>
          </div>
        )}

        {/* Upload zone ou état du template */}
        {(!hasTemplate || showReplace) ? (
          <div>
            <DocumentUpload
              projectId={projectId}
              documentType="MODELE_MEMOIRE"
              accept=".pdf,.doc,.docx"
              hideTypeSelector
              maxFiles={1}
              onUploadComplete={onUploadComplete}
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50/60 p-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Template mémoire défini : <span className="font-normal">{templateName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Statut : {template?.status || 'UPLOADED'} • Sections détectées :{' '}
                {template?.metaJson?.nbSections ?? '—'}
              </p>
              {template?.document?.id && (
                <div className="flex items-center gap-2 mt-2">
                  <Link href={`/projects/${projectId}/documents/${template.document.id}`} className="text-xs underline flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Voir le fichier
                  </Link>
                  {template.status === 'PARSED' && (
                    <Link href={`/projects/${projectId}/questions`} className="text-xs underline flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Voir les questions
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Utiliser un document existant marqué comme MODELE_MEMOIRE */}
        {templateDocuments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Utiliser un document existant comme template</p>
            <div className="flex flex-wrap gap-2">
              {templateDocuments.map((doc) => (
                <div key={doc.id} className="relative">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-2 pr-9"
                    disabled={!!selectingId}
                    onClick={async () => {
                      setSelectingId(doc.id)
                      try {
                        await onCreateTemplate(doc.id)
                      } finally {
                        setSelectingId(null)
                      }
                    }}
                  >
                    {selectingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {selectingId === doc.id ? 'Définition...' : doc.name}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Supprimer ce template"
                    disabled={!!selectingId || !onRemoveTemplate}
                    onClick={(e) => {
                      e.stopPropagation()
                      setToRemoveId(doc.id)
                      setConfirmOpen(true)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce template ?</DialogTitle>
            <DialogDescription>
              Le document sera retiré de la liste des templates. Vous pourrez toujours le réutiliser plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
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


