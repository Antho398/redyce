/**
 * Carte pour afficher et éditer une question de template
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit2, Trash2, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExtractedSection {
  id?: string
  order: number
  title: string
  required: boolean
}

interface ExtractedQuestion {
  id?: string
  sectionId?: string | null
  sectionOrder?: number | null
  order: number
  title: string
  questionType: 'TEXT' | 'YES_NO'
  required: boolean
}

interface QuestionCardProps {
  section: ExtractedSection | null
  question: ExtractedQuestion
  onEdit: (questionId: string, updates: Partial<ExtractedQuestion>) => Promise<void>
  onDelete: (questionId: string) => Promise<void>
}

export function QuestionCard({ section, question, onEdit, onDelete }: QuestionCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(question.title)
  const [questionType, setQuestionType] = useState<'TEXT' | 'YES_NO'>(question.questionType)
  const [required, setRequired] = useState(question.required)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!question.id) return

    try {
      setSaving(true)
      await onEdit(question.id, {
        title,
        questionType,
        required,
      })
      setEditing(false)
    } catch (err) {
      // L'erreur est gérée par le parent
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(question.title)
    setQuestionType(question.questionType)
    setRequired(question.required)
    setEditing(false)
  }

  if (!question.id) {
    // Mode lecture seule si pas d'ID
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {question.order}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-foreground">{question.title}</p>
                  {question.questionType === 'YES_NO' && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Question OUI/NON
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {!editing ? (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {question.order}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{question.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {question.questionType === 'YES_NO' && (
                        <Badge variant="outline" className="text-xs">
                          Question OUI/NON
                        </Badge>
                      )}
                      {question.required && (
                        <Badge variant="secondary" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`title-${question.id}`}>Question</Label>
                <Input
                  id={`title-${question.id}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`type-${question.id}`}>Type de question</Label>
                <select
                  id={`type-${question.id}`}
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'TEXT' | 'YES_NO')}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="TEXT">Question texte</option>
                  <option value="YES_NO">Question OUI/NON</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={required}
                  onCheckedChange={(checked) => setRequired(checked === true)}
                />
                <Label htmlFor={`required-${question.id}`} className="cursor-pointer">
                  Question obligatoire
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette question ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La question sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (question.id) {
                  await onDelete(question.id)
                  setDeleteDialogOpen(false)
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

