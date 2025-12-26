/**
 * Modal de prévisualisation du contenu d'un export
 * Affiche les questions et leurs réponses avec séparateurs de chapitres
 * Inclut une étape de nommage avant l'export final
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { ApiResponse } from '@/types/api'

interface MemoireSection {
  id: string
  title: string
  question?: string
  content?: string
  status: string
  order: number
  itemId?: string | null
  itemTitle?: string | null
  itemOrder?: number | null
}

interface Item {
  id: string
  title: string
  order: number
}

interface SectionsResponse {
  sections: MemoireSection[]
  items: Item[]
}

interface ExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memoireId: string
  memoireTitle: string
  onExport: (fileName: string) => void
  exporting?: boolean
  isViewOnly?: boolean
}

type DialogStep = 'preview' | 'naming'

export function ExportPreviewDialog({
  open,
  onOpenChange,
  memoireId,
  memoireTitle,
  onExport,
  exporting = false,
  isViewOnly = false,
}: ExportPreviewDialogProps) {
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<MemoireSection[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<DialogStep>('preview')
  const [fileName, setFileName] = useState('')
  const [fileNameError, setFileNameError] = useState<string | null>(null)

  useEffect(() => {
    if (open && memoireId) {
      fetchSections()
      // Générer un nom de fichier par défaut avec date/heure
      const now = new Date()
      const dateStr = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-')
      const timeStr = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).replace(':', 'h')
      const defaultName = `${memoireTitle} - ${dateStr} ${timeStr}`
      setFileName(defaultName)
      setStep('preview')
      setFileNameError(null)
    }
  }, [open, memoireId, memoireTitle])

  const fetchSections = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/memos/${memoireId}/sections`)
      const data: ApiResponse<SectionsResponse | MemoireSection[]> = await response.json()

      if (data.success && data.data) {
        // Support ancien format (array) et nouveau format (object avec sections et items)
        if (Array.isArray(data.data)) {
          setSections(data.data)
          setItems([])
        } else {
          setSections(data.data.sections || [])
          setItems(data.data.items || [])
        }
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sections')
    } finally {
      setLoading(false)
    }
  }

  // Trier les sections : si toutes ont un itemOrder, trier par itemOrder puis order
  // Sinon, garder l'ordre original (order)
  const sortedSections = useMemo(() => {
    const allHaveItemOrder = sections.every(s => s.itemOrder !== null && s.itemOrder !== undefined)

    return [...sections].sort((a, b) => {
      if (allHaveItemOrder) {
        // Toutes les questions ont un chapitre, trier par chapitre puis par ordre dans le chapitre
        const aItemOrder = a.itemOrder ?? 0
        const bItemOrder = b.itemOrder ?? 0
        if (aItemOrder !== bItemOrder) {
          return aItemOrder - bItemOrder
        }
      }
      // Sinon (ou au sein du même chapitre), trier par order original
      return a.order - b.order
    })
  }, [sections])

  const filledSections = sections.filter(s => s.content && s.content.trim().length > 0)
  const emptySections = sections.filter(s => !s.content || s.content.trim().length === 0)

  const handleGoToNaming = () => {
    setStep('naming')
  }

  const handleBackToPreview = () => {
    setStep('preview')
    setFileNameError(null)
  }

  const validateFileName = (name: string): boolean => {
    if (!name.trim()) {
      setFileNameError('Le nom du fichier est requis')
      return false
    }
    // Caractères interdits dans les noms de fichiers
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      setFileNameError('Le nom contient des caractères invalides (< > : " / \\ | ? *)')
      return false
    }
    if (name.length > 200) {
      setFileNameError('Le nom est trop long (max 200 caractères)')
      return false
    }
    setFileNameError(null)
    return true
  }

  const handleExport = () => {
    if (!validateFileName(fileName)) return
    onExport(fileName.trim())
    onOpenChange(false)
  }

  // Déterminer s'il y a des chapitres
  const hasItems = items.length > 0 && sections.some(s => s.itemId)

  // Calculer le numéro global de la question
  const getGlobalIndex = (index: number) => index + 1

  // Tracker le dernier itemId affiché pour savoir quand afficher un en-tête
  let lastDisplayedItemId: string | null | undefined = undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        {step === 'preview' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prévisualisation du contenu
              </DialogTitle>
              <DialogDescription>
                {memoireTitle}
              </DialogDescription>
            </DialogHeader>

            {/* Message d'avertissement */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800">
                <p className="font-medium">Aperçu du contenu uniquement</p>
                <p className="text-blue-600 mt-0.5">
                  Cette prévisualisation montre les questions et leurs réponses.
                  La mise en forme finale dépendra de votre template DOCX d'origine et sera ajustable dans le fichier exporté.
                </p>
              </div>
            </div>

            {/* Statistiques */}
            {!loading && !error && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {filledSections.length} complétée{filledSections.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                {emptySections.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {emptySections.length} vide{emptySections.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                <span className="text-muted-foreground">
                  sur {sections.length} question{sections.length > 1 ? 's' : ''}
                  {hasItems && ` • ${items.length} chapitre${items.length > 1 ? 's' : ''}`}
                </span>
              </div>
            )}

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto pr-4 -mr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune section trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSections.map((section, index) => {
                    // Déterminer si on doit afficher un en-tête de chapitre
                    const showChapterHeader = hasItems && section.itemId !== lastDisplayedItemId
                    lastDisplayedItemId = section.itemId

                    return (
                      <div key={section.id}>
                        {/* En-tête de chapitre (intercalé) */}
                        {showChapterHeader && section.itemTitle && (
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                            <h3 className="font-semibold text-sm text-primary">
                              {section.itemTitle}
                            </h3>
                          </div>
                        )}

                        {/* Carte de la question (design original) */}
                        <div className="border rounded-lg overflow-hidden">
                          {/* En-tête de la section */}
                          <div className="flex items-start gap-3 p-3 bg-muted/50 border-b">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {getGlobalIndex(index)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm leading-tight">
                                {section.title}
                              </h4>
                              {section.question && section.question !== section.title && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {section.question}
                                </p>
                              )}
                            </div>
                            {section.content && section.content.trim().length > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>

                          {/* Contenu de la réponse */}
                          <div className="p-3">
                            {section.content && section.content.trim().length > 0 ? (
                              <p className="text-sm whitespace-pre-wrap text-foreground">
                                {section.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Aucune réponse fournie
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={exporting}
              >
                Fermer
              </Button>
              {!isViewOnly && (
                <Button
                  onClick={handleGoToNaming}
                  disabled={loading || !!error}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Nommer votre export
              </DialogTitle>
              <DialogDescription>
                Donnez un nom unique à ce fichier pour le retrouver facilement
              </DialogDescription>
            </DialogHeader>

            {/* Formulaire de nommage */}
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileName" className="text-sm font-medium">
                  Nom du fichier
                </Label>
                <div className="relative">
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => {
                      setFileName(e.target.value)
                      if (fileNameError) validateFileName(e.target.value)
                    }}
                    placeholder="Ex: Mémoire technique - V2 finale"
                    className={fileNameError ? 'border-destructive pr-20' : 'pr-20'}
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    .docx
                  </span>
                </div>
                {fileNameError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fileNameError}
                  </p>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    `${memoireTitle} - Version finale`,
                    `${memoireTitle} - Brouillon`,
                    `${memoireTitle} - V${Math.floor(Math.random() * 3) + 2}`,
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setFileName(suggestion)
                        setFileNameError(null)
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Sections complétées</span>
                  <span className="font-medium text-foreground">{filledSections.length} / {sections.length}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleBackToPreview}
                disabled={exporting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting || !fileName.trim()}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter le DOCX
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
