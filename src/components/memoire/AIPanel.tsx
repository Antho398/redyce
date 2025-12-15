/**
 * Panneau IA pour l'assistant de section mémoire
 * Actions : Compléter, Reformuler, Raccourcir, Extraire exigences
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Sparkles,
  FileText,
  FileCheck,
  FileMinus,
  ClipboardList,
  CheckCircle2,
  X,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

export type AIActionType = 'complete' | 'reformulate' | 'shorten' | 'extractRequirements'

interface Citation {
  documentId: string
  documentName: string
  documentType: string
  page?: number
  quote?: string
}

interface AIResult {
  resultText: string
  citations: Citation[]
}

interface AIPanelProps {
  projectId: string
  memoireId: string
  sectionId: string | null
  sectionContent: string
  onReplace: (text: string) => void
  onInsert: (text: string) => void
}

const actionConfig: Record<AIActionType, { label: string; icon: React.ReactNode; description: string }> = {
  complete: {
    label: 'Compléter',
    icon: <FileText className="h-4 w-4" />,
    description: 'Génère un brouillon complet',
  },
  reformulate: {
    label: 'Reformuler',
    icon: <FileCheck className="h-4 w-4" />,
    description: 'Améliore le texte existant',
  },
  shorten: {
    label: 'Raccourcir',
    icon: <FileMinus className="h-4 w-4" />,
    description: 'Version plus concise',
  },
  extractRequirements: {
    label: 'Extraire exigences',
    icon: <ClipboardList className="h-4 w-4" />,
    description: 'Liste des exigences pertinentes',
  },
}

export function AIPanel({ projectId, memoireId, sectionId, sectionContent, onReplace, onInsert }: AIPanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (actionType: AIActionType) => {
    if (!sectionId) {
      toast.error('Veuillez sélectionner une section')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ia/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          memoireId,
          sectionId,
          actionType,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setResult(data.data)
        toast.success('Proposition générée avec succès')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.resultText) {
      navigator.clipboard.writeText(result.resultText)
      toast.success('Texte copié dans le presse-papiers')
    }
  }

  const handleReplace = () => {
    if (result?.resultText) {
      onReplace(result.resultText)
      toast.success('Texte remplacé')
      setResult(null)
    }
  }

  const handleInsert = () => {
    if (result?.resultText) {
      onInsert(result.resultText)
      toast.success('Texte inséré à la fin')
      setResult(null)
    }
  }

  if (!sectionId) {
    return (
      <div className="w-80 border-l bg-muted/30 p-4">
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Sélectionnez une section pour utiliser l'assistant IA
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col overflow-hidden">
      <Card className="m-4 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Assistant IA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Actions */}
          <div className="space-y-2">
            {Object.entries(actionConfig).map(([actionType, config]) => (
              <Button
                key={actionType}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAction(actionType as AIActionType)}
                disabled={loading || (actionType === 'reformulate' && !sectionContent.trim()) || (actionType === 'shorten' && !sectionContent.trim())}
              >
                {config.icon}
                <span className="ml-2 flex-1 text-left">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </span>
              </Button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Proposition</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResult(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3 bg-muted rounded-md border text-sm max-h-64 overflow-y-auto">
                {result.resultText}
              </div>

              {/* Actions sur le résultat */}
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleReplace}
                  className="flex-1"
                >
                  Remplacer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInsert}
                  className="flex-1"
                >
                  Insérer à la fin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Citations */}
              {result.citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Sources utilisées</h4>
                  <div className="space-y-1">
                    {result.citations.map((citation, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-background border rounded-md text-xs"
                      >
                        <div className="font-medium">{citation.documentName}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {citation.documentType}
                        </Badge>
                        {citation.quote && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {citation.quote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

