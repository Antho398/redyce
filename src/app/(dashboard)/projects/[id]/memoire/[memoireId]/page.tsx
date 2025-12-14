/**
 * Page d'édition d'un mémoire technique
 * Layout 3 colonnes : sections | éditeur | panneau IA
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Circle,
  PlayCircle,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { useDebounce } from '@/hooks/useDebounce'

interface MemoireSection {
  id: string
  title: string
  order: number
  question?: string
  status: string
  content?: string
  sourceRequirementIds: string[]
  createdAt: string
  updatedAt: string
}

export default function MemoireEditPage({
  params,
}: {
  params: { id: string; memoireId: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const memoireId = params.memoireId
  const [sections, setSections] = useState<MemoireSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiProposal, setAiProposal] = useState<string | null>(null)
  const [aiCitations, setAiCitations] = useState<Array<{
    documentId: string
    documentName: string
    page?: number
    quote?: string
  }>>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  // Debounce pour l'autosave
  const debouncedContent = useDebounce(content, 2000)

  useEffect(() => {
    fetchSections()
  }, [memoireId])

  useEffect(() => {
    if (selectedSection) {
      setContent(selectedSection.content || '')
    }
  }, [selectedSection])

  // Autosave quand le contenu change
  useEffect(() => {
    if (debouncedContent !== undefined && selectedSectionId && debouncedContent !== selectedSection?.content) {
      saveSection(selectedSectionId, debouncedContent)
    }
  }, [debouncedContent, selectedSectionId])

  const fetchSections = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/memos/${memoireId}/sections`)
      const data: ApiResponse<MemoireSection[]> = await response.json()

      if (data.success && data.data) {
        setSections(data.data)
        // Sélectionner la première section par défaut
        if (data.data.length > 0 && !selectedSectionId) {
          setSelectedSectionId(data.data[0].id)
        }
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des sections')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (sectionId: string, newContent: string) => {
    try {
      setSaving(true)

      const response = await fetch(`/api/memos/${memoireId}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          status: newContent.trim().length > 0 ? 'IN_PROGRESS' : 'DRAFT',
        }),
      })

      const data: ApiResponse<MemoireSection> = await response.json()

      if (data.success && data.data) {
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? data.data : s))
        )
        toast.success('Section sauvegardée', 'Les modifications ont été enregistrées automatiquement')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      console.error('Error saving section:', err)
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder')
    } finally {
      setSaving(false)
    }
  }

  const handleAIAction = async (action: 'improve' | 'rewrite' | 'complete' | 'explain') => {
    if (!selectedSection) {
      toast.error('Veuillez sélectionner une section')
      return
    }

    if ((action === 'improve' || action === 'rewrite') && !content.trim()) {
      toast.error('Veuillez d\'abord rédiger du contenu pour cette section')
      return
    }

    try {
      setAiLoading(true)
      setAiProposal(null)
      setAiCitations([])

      const response = await fetch('/api/ia/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoireId,
          sectionId: selectedSection.id,
          action,
        }),
      })

      const data: ApiResponse<{
        proposition: string
        citations: Array<{
          documentId: string
          documentName: string
          page?: number
          quote?: string
        }>
      }> = await response.json()

      if (data.success && data.data) {
        setAiProposal(data.data.proposition)
        setAiCitations(data.data.citations)
        toast.success('Proposition générée', 'La proposition IA est prête')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération IA'
      toast.error('Erreur IA', errorMessage)
      console.error('AI action error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleApplyProposal = () => {
    if (aiProposal && selectedSection) {
      setContent(aiProposal)
      toast.success('Proposition appliquée', 'Le contenu a été remplacé par la proposition')
    }
  }

  const handleCopyProposal = async () => {
    if (aiProposal) {
      await navigator.clipboard.writeText(aiProposal)
      setCopied(true)
      toast.success('Copié', 'La proposition a été copiée dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complétée
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="text-xs">
            <PlayCircle className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <Circle className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-6">
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button onClick={fetchSections} variant="outline" size="sm" className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 via-accent/10 to-[#F8D347]/25 rounded-lg p-3 -mx-4 px-4">
        <h1 className="text-xl font-semibold">Édition du mémoire</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sections.length} section{sections.length > 1 ? 's' : ''} • {saving && 'Sauvegarde...'}
        </p>
      </div>

      {/* Layout 3 colonnes */}
      <div className="grid grid-cols-12 gap-3">
        {/* Colonne gauche : Liste des sections */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`w-full text-left p-3 border-l-2 transition-colors ${
                      selectedSectionId === section.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {section.order}
                        </p>
                        <p className="text-sm font-medium truncate">{section.title}</p>
                        {section.question && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {section.question}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(section.status)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne centre : Éditeur */}
        <div className="col-span-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedSection ? selectedSection.title : 'Sélectionnez une section'}
                </CardTitle>
                {saving && (
                  <Badge variant="outline" className="text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sauvegarde...
                  </Badge>
                )}
              </div>
              {selectedSection?.question && (
                <p className="text-xs text-muted-foreground mt-2">{selectedSection.question}</p>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre réponse ici..."
                className="min-h-[400px] font-mono text-sm"
                disabled={!selectedSection}
              />
              {selectedSection && (
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{content.length} caractères</span>
                  <span>Autosave activé</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Panneau IA */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Assistant IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAIAction('improve')}
                  disabled={!selectedSection || !content.trim() || aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Améliorer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAIAction('rewrite')}
                  disabled={!selectedSection || !content.trim() || aiLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reformuler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAIAction('complete')}
                  disabled={!selectedSection || aiLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Compléter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAIAction('explain')}
                  disabled={!selectedSection || aiLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Expliquer
                </Button>
              </div>

              {/* Proposition */}
              {aiProposal && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Proposition</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={handleCopyProposal}
                        title="Copier"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 max-h-[300px] overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap">{aiProposal}</p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleApplyProposal}
                  >
                    Appliquer dans l'éditeur
                  </Button>

                  {/* Citations */}
                  {aiCitations.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold mb-2">Sources</p>
                      <div className="space-y-1">
                        {aiCitations.map((citation, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">
                            <p className="font-medium">{citation.documentName}</p>
                            {citation.quote && (
                              <p className="mt-1 italic line-clamp-2">{citation.quote}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              {!aiProposal && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    L'assistant utilise le contexte du projet (exigences, documents) pour générer des propositions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

