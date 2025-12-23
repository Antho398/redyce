/**
 * Panneau IA pour l'assistant de section mémoire
 * Actions : Compléter, Reformuler, Raccourcir, Enrichir
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Sparkles,
  FileText,
  FileCheck,
  FileMinus,
  Plus,
  CheckCircle2,
  X,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

export type AIActionType = 'complete' | 'reformulate' | 'shorten' | 'enrich'

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
  enrich: {
    label: 'Enrichir',
    icon: <Plus className="h-4 w-4" />,
    description: 'Ajoute des détails et précisions',
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


  return (
    <div className="flex flex-col space-y-4">
      {/* Actions - Grille 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(actionConfig).map(([actionType, config]) => (
          <Button
            key={actionType}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-3 flex flex-col items-center justify-center text-center"
            onClick={() => handleAction(actionType as AIActionType)}
            disabled={loading || (actionType === 'reformulate' && !sectionContent.trim()) || (actionType === 'shorten' && !sectionContent.trim()) || (actionType === 'enrich' && !sectionContent.trim())}
          >
            {config.icon}
            <span className="mt-1.5 font-medium text-xs">{config.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{config.description}</span>
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
    </div>
  )
}

