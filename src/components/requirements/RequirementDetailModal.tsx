/**
 * Modal de détail d'une exigence
 * Affiche les informations complètes + actions (lier section, marquer couverte, générer IA)
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Link2,
  FileText,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface Requirement {
  id: string
  code?: string
  title: string
  description: string
  category?: string
  priority?: string
  status: string
  sourcePage?: number
  sourceQuote?: string
  createdAt: string
  document?: {
    id: string
    name: string
    fileName: string
    documentType: string
  }
  sectionLinks?: Array<{
    id: string
    section: {
      id: string
      title: string
      order: number
    }
  }>
}

interface MemoireSection {
  id: string
  title: string
  order: number
}

interface RequirementDetailModalProps {
  requirement: Requirement | null
  projectId: string
  memoireId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function RequirementDetailModal({
  requirement,
  projectId,
  memoireId,
  open,
  onOpenChange,
  onUpdate,
}: RequirementDetailModalProps) {
  const [sections, setSections] = useState<MemoireSection[]>([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [linking, setLinking] = useState(false)
  const [markingCovered, setMarkingCovered] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (open && memoireId) {
      fetchSections()
    }
  }, [open, memoireId])

  const fetchSections = async () => {
    if (!memoireId) return

    try {
      setLoadingSections(true)
      const response = await fetch(`/api/memos/${memoireId}/sections`)
      const data = await response.json()

      if (data.success && data.data) {
        setSections(data.data.sort((a: MemoireSection, b: MemoireSection) => a.order - b.order))
      }
    } catch (err) {
      console.error('Error fetching sections:', err)
    } finally {
      setLoadingSections(false)
    }
  }

  const handleLinkToSection = async () => {
    if (!requirement || !selectedSectionId) return

    try {
      setLinking(true)
      const response = await fetch(`/api/requirements/${requirement.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSectionId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Exigence liée à la section')
        onUpdate()
        setSelectedSectionId('')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la liaison')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la liaison')
    } finally {
      setLinking(false)
    }
  }

  const handleMarkAsCovered = async () => {
    if (!requirement) return

    try {
      setMarkingCovered(true)
      const response = await fetch(`/api/requirements/${requirement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COVERED' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Exigence marquée comme couverte')
        onUpdate()
        onOpenChange(false)
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setMarkingCovered(false)
    }
  }

  const handleGenerateAISuggestion = async () => {
    if (!requirement || !memoireId || !selectedSectionId) {
      toast.error('Veuillez d\'abord lier l\'exigence à une section')
      return
    }

    try {
      setGenerating(true)
      const response = await fetch('/api/ia/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          memoireId,
          sectionId: selectedSectionId,
          actionType: 'complete',
          // TODO: passer l'exigence comme contexte supplémentaire dans le futur
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        toast.success('Proposition générée', 'Ouvrez l\'éditeur de mémoire pour voir la proposition')
        // TODO: ouvrir l'éditeur avec la section et la proposition pré-remplie
        window.open(`/projects/${projectId}/memoire/${memoireId}?sectionId=${selectedSectionId}`, '_blank')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    switch (priority) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="text-xs">
            Haute
          </Badge>
        )
      case 'MED':
        return (
          <Badge variant="secondary" className="text-xs">
            Moyenne
          </Badge>
        )
      case 'LOW':
        return (
          <Badge variant="outline" className="text-xs">
            Basse
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COVERED':
        return (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Couverte
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="text-xs">
            En cours
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            À traiter
          </Badge>
        )
    }
  }

  if (!requirement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détail de l'exigence</span>
            {getStatusBadge(requirement.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations principales */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {requirement.code && (
                <Badge variant="outline" className="font-mono text-xs">
                  {requirement.code}
                </Badge>
              )}
              {getPriorityBadge(requirement.priority)}
              {requirement.category && (
                <Badge variant="secondary" className="text-xs">
                  {requirement.category}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{requirement.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {requirement.description}
            </p>
          </div>

          {/* Source */}
          {requirement.document && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Source</h4>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`/projects/${projectId}/documents/${requirement.document.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {requirement.document.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {requirement.sourcePage && (
                  <span className="text-xs text-muted-foreground">
                    (Page {requirement.sourcePage})
                  </span>
                )}
              </div>
              {requirement.sourceQuote && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm italic">
                  "{requirement.sourceQuote}"
                </div>
              )}
            </div>
          )}

          {/* Sections liées */}
          {requirement.sectionLinks && requirement.sectionLinks.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Liée aux sections</h4>
              <div className="space-y-1">
                {requirement.sectionLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      {link.section.order}.
                    </span>
                    <span>{link.section.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold">Actions</h4>

            {/* Lier à une section */}
            {memoireId && (
              <div className="space-y-2">
                <Label>Lier à une section du mémoire</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSectionId}
                    onValueChange={setSelectedSectionId}
                    disabled={loadingSections}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={loadingSections ? 'Chargement...' : 'Sélectionner une section'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.order}. {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleLinkToSection}
                    disabled={!selectedSectionId || linking}
                    size="sm"
                  >
                    {linking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Lier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Générer proposition IA */}
            {memoireId && selectedSectionId && (
              <Button
                onClick={handleGenerateAISuggestion}
                disabled={generating}
                variant="outline"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer une proposition IA pour la section liée
                  </>
                )}
              </Button>
            )}

            {/* Marquer comme couverte */}
            {requirement.status !== 'COVERED' && (
              <Button
                onClick={handleMarkAsCovered}
                disabled={markingCovered}
                variant="default"
                className="w-full"
              >
                {markingCovered ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer comme couverte
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

