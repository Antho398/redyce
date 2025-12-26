/**
 * Éditeur de section (zone centrale)
 * Avec autosave, statut, bouton "Marquer comme relu"
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Loader2,
  CheckCircle2,
  FileCheck,
  Sparkles,
} from 'lucide-react'

interface MemoireSection {
  id: string
  title: string
  order: number
  question?: string
  status: string
  content?: string
}

interface SectionEditorProps {
  section: MemoireSection | null
  content: string
  onContentChange: (content: string) => void
  saving: boolean
  saved: boolean
  onUpdateStatus: (status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEWED' | 'VALIDATED') => void
  projectId?: string
  memoireId?: string
  isFrozen?: boolean
  onOpenAI?: () => void
}

export function SectionEditor({
  section,
  content,
  onContentChange,
  saving,
  saved,
  onUpdateStatus,
  projectId,
  memoireId,
  isFrozen = false,
  onOpenAI,
}: SectionEditorProps) {
  const [generating, setGenerating] = useState(false)
  const [isAIGenerated, setIsAIGenerated] = useState(false)
  const [responseLength, setResponseLength] = useState<'short' | 'standard' | 'detailed'>('standard')

  // Auto-resize du textarea au chargement et changement de contenu
  useEffect(() => {
    const timer = setTimeout(() => {
      const textarea = document.querySelector('textarea[data-section-editor]') as HTMLTextAreaElement
      if (textarea && content) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [content, section?.id])

  const handleGenerateResponse = async () => {
    if (!section || !projectId || !memoireId) return

    setGenerating(true)
    try {
      const response = await fetch('/api/ia/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          memoireId,
          sectionId: section.id,
          actionType: 'complete',
          responseLength,
        }),
      })

      const data = await response.json()
      if (data.success && data.data?.resultText) {
        const generatedText = data.data.resultText
        onContentChange(generatedText)
        setIsAIGenerated(true)
        
        // Sauvegarder immédiatement le contenu généré dans la base de données
        try {
          const saveResponse = await fetch(
            `/api/memos/${memoireId}/sections/${section.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: generatedText,
              }),
            }
          )
          const saveData = await saveResponse.json()
          if (!saveData.success) {
            console.error('Failed to save generated content:', saveData.error)
            // Ne pas afficher d'erreur à l'utilisateur, l'autosave le fera plus tard
          }
        } catch (saveErr) {
          console.error('Error saving generated content:', saveErr)
          // Ne pas afficher d'erreur à l'utilisateur, l'autosave le fera plus tard
        }
        
        toast.success('Proposition générée', 'Une proposition de réponse a été générée. Vous pouvez la modifier, compléter ou supprimer librement.')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      console.error('Error generating response:', err)
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de générer la réponse')
    } finally {
      setGenerating(false)
    }
  }

  // Réinitialiser le flag IA quand on change de section
  useEffect(() => {
    setIsAIGenerated(false)
  }, [section?.id])

  // Réinitialiser le flag IA si l'utilisateur modifie manuellement le contenu
  const handleContentChange = (newContent: string) => {
    if (isAIGenerated && newContent !== content) {
      setIsAIGenerated(false)
    }
    onContentChange(newContent)
  }
  
  if (!section) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="m-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Sélectionnez une section pour commencer
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const isReviewed = section.status === 'REVIEWED' || section.status === 'VALIDATED' || section.status === 'COMPLETED'
  const currentStatus = section.status

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Card className="m-4 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold">RÉPONSE</h2>
                {saving && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Enregistrement...
                  </span>
                )}
                {saved && !saving && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Enregistré
                  </span>
                )}
              </div>
              {section.question && (
                <p className="text-sm text-muted-foreground">
                  {section.question}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bouton Assistant IA en bleu */}
              {projectId && memoireId && !isFrozen && onOpenAI && (
                <Button
                  size="sm"
                  onClick={onOpenAI}
                  className="text-xs gap-1.5 h-7"
                  data-tutorial="ai-generate-btn"
                >
                  <Sparkles className="h-3 w-3" />
                  Assistant IA
                </Button>
              )}
              {/* Bouton de statut principal */}
              {!isFrozen && currentStatus === 'DRAFT' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus('IN_PROGRESS')}
                  disabled={saving || !content.trim()}
                  title="Marquer comme prêt à être relu"
                  className="text-xs gap-1.5 h-7"
                  data-tutorial="memoire-status"
                >
                  <FileCheck className="h-3 w-3" />
                  À relire
                </Button>
              )}
              {!isFrozen && currentStatus === 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus('REVIEWED')}
                  disabled={saving}
                  title="Marquer comme relu"
                  className="text-xs gap-1.5 h-7"
                  data-tutorial="memoire-status"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Relu
                </Button>
              )}
              {!isFrozen && (currentStatus === 'REVIEWED' || currentStatus === 'COMPLETED') && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus('VALIDATED')}
                  disabled={saving}
                  title="Valider définitivement"
                  className="text-xs gap-1.5 h-7"
                  data-tutorial="memoire-status"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Valider
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          {/* Micro-copy discrète en en-tête si réponse générée par IA */}
          {isAIGenerated && content.trim() && (
            <div className="px-4 pt-3 pb-2 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/60">
                  Proposition générée à partir des documents du projet et de sources externes.
                </span>
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {isFrozen && (
              <div className="px-4 pt-3 pb-2 bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
                <p className="text-xs text-yellow-800">
                  Version figée – Consultation uniquement. Créez une nouvelle version pour modifier.
                </p>
              </div>
            )}
            <div className="flex-1 overflow-auto p-4">
              <Textarea
                data-section-editor
                value={content}
                onChange={(e) => {
                  handleContentChange(e.target.value)
                  // Auto-resize
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Commencez à rédiger votre réponse..."
                className="min-h-[200px] border rounded-md focus-visible:ring-1 resize-none overflow-hidden whitespace-pre-wrap p-3 text-sm"
                disabled={isFrozen}
                readOnly={isFrozen}
              />
            </div>
          </div>
          {/* Footer compact avec compteur et actions secondaires */}
          <div className="border-t px-4 py-2 bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {content.length} caractères
              </div>
              <div className="flex items-center gap-2">
                {/* Bouton secondaire : revenir au brouillon */}
                {!isFrozen && (currentStatus === 'IN_PROGRESS' || currentStatus === 'REVIEWED' || currentStatus === 'VALIDATED' || currentStatus === 'COMPLETED') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus('DRAFT')}
                    disabled={saving}
                    title="Revenir au brouillon pour modifier"
                    className="text-xs h-7"
                  >
                    Repasser en brouillon
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

