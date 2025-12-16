/**
 * Éditeur de section (zone centrale)
 * Avec autosave, statut, bouton "Marquer comme relu"
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  CheckCircle2,
  FileCheck,
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
  onMarkAsReviewed: () => void
}

export function SectionEditor({
  section,
  content,
  onContentChange,
  saving,
  saved,
  onMarkAsReviewed,
}: SectionEditorProps) {
  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center border-r">
        <div className="text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Sélectionnez une section pour commencer
          </p>
        </div>
      </div>
    )
  }

  const isReviewed = section.status === 'COMPLETED' || section.status === 'REVIEWED'

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r">
      <Card className="m-4 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold">RÉPONSE</h2>
              {section.question && (
                <p className="text-sm text-muted-foreground mt-1">
                  {section.question}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
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
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Commencez à rédiger votre réponse..."
            className="flex-1 min-h-0 border-0 rounded-none focus-visible:ring-0 resize-none p-4"
            style={{ height: '100%' }}
          />
          <div className="border-t p-3 flex items-center justify-between bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {content.length} caractères
            </div>
            <Button
              variant={isReviewed ? 'default' : 'outline'}
              size="sm"
              onClick={onMarkAsReviewed}
              disabled={!content.trim()}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              {isReviewed ? 'Relu' : 'Marquer comme relu'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

