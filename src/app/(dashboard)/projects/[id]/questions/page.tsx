/**
 * Page d'affichage des questions extraites du template mémoire
 * Permet de review les sections avant de créer un mémoire
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { QuestionCard } from '@/components/template/QuestionCard'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

interface ExtractedSection {
  order: number
  title: string
  path?: string
  required: boolean
  sourceAnchorJson?: {
    type: 'docx' | 'pdf'
    position?: number
    page?: number
    element?: string
  }
}

interface TemplateData {
  id: string
  name: string
  status: string
  metaJson?: {
    nbSections?: number
    warnings?: string[]
  }
  sections?: ExtractedSection[]
}

export default function QuestionsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [projectId])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      
      // Récupérer le template (inclut maintenant les questions depuis la BDD)
      const templateResponse = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const templateData = await templateResponse.json()

      if (!templateData.success || !templateData.data) {
        toast.error('Erreur', 'Aucun template trouvé. Veuillez d\'abord parser le template.')
        router.push(`/projects/${projectId}/documents`)
        return
      }

      const templateInfo = templateData.data

      // Si le template n'a pas été parsé (pas de sections), proposer de parser
      if (!templateInfo.sections || templateInfo.sections.length === 0) {
        setTemplate({
          ...templateInfo,
          sections: [],
        })
      } else {
        setTemplate(templateInfo)
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de charger le template')
      router.push(`/projects/${projectId}/documents`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditQuestion = async (questionId: string, updates: Partial<ExtractedSection>) => {
    try {
      const response = await fetch(`/api/template-questions/question/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Question mise à jour', 'La question a été modifiée avec succès')
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de mettre à jour la question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/template-questions/question/${questionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Question supprimée', 'La question a été supprimée avec succès')
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer la question')
    }
  }

  const handleCreateMemoire = async () => {
    if (!template) return

    try {
      setCreating(true)
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateDocumentId: template.id,
          title: `Mémoire technique - ${template.name}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mémoire créé', 'Votre mémoire technique a été créé avec succès')
        router.push(`/projects/${projectId}/memoire/${data.data.id}`)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de créer le mémoire')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des questions...</p>
        </div>
      </div>
    )
  }

  if (!template || !template.questions || template.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/projects/${projectId}/documents`}>
            <Button variant="ghost" size="sm">← Retour</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune question extraite</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vous devez d'abord parser le template mémoire pour extraire les questions.
            </p>
            <Link href={`/projects/${projectId}/documents`}>
              <Button variant="default">Aller aux documents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sections = template.sections || []
  const questions = template.questions || []
  
  // Grouper les questions par section
  const questionsBySection = new Map<number | null, ExtractedQuestion[]>()
  questions.forEach((q) => {
    const key = q.sectionOrder ?? null
    if (!questionsBySection.has(key)) {
      questionsBySection.set(key, [])
    }
    questionsBySection.get(key)!.push(q)
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/projects/${projectId}/documents`}>
          <Button variant="ghost" size="sm">← Retour aux documents</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-[#F8D347]/25 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Questions extraites du template</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {template.name} • {sections.length} section{sections.length > 1 ? 's' : ''} • {questions.length} question{questions.length > 1 ? 's' : ''}
              {template.companyForm && (
                <span className="ml-2">
                  • <Link href={`/projects/${projectId}/company-form`} className="underline">Formulaire entreprise</Link>
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {template.companyForm && (
              <Link href={`/projects/${projectId}/company-form`}>
                <Button variant="outline" className="gap-2">
                  Remplir le formulaire
                </Button>
              </Link>
            )}
            <Button onClick={handleCreateMemoire} disabled={creating} className="gap-2">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                Créer le mémoire
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            </Button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {template.metaJson?.warnings && template.metaJson.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/60">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Avertissements</p>
                <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                  {template.metaJson.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des sections et questions */}
      <div className="space-y-6">
        {sections.map((section) => {
          const sectionQuestions = questionsBySection.get(section.order) || []
          return (
            <div key={section.id || section.order} className="space-y-3">
              {/* Titre de section */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {section.order}
                    </div>
                    <h2 className="font-semibold text-lg">{section.title}</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {sectionQuestions.length} question{sectionQuestions.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Questions de la section */}
              <div className="space-y-2 ml-4">
                {sectionQuestions.map((question) => (
                  <QuestionCard
                    key={question.id || `${section.order}-${question.order}`}
                    section={section}
                    question={question}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            </div>
          )
        })}
        
        {/* Questions sans section */}
        {questionsBySection.has(null) && (
          <div className="space-y-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <h2 className="font-semibold text-lg">Questions générales</h2>
              </CardContent>
            </Card>
            <div className="space-y-2 ml-4">
              {questionsBySection.get(null)!.map((question) => (
                <QuestionCard
                  key={question.id || question.order}
                  section={null}
                  question={question}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Vous pouvez maintenant créer votre mémoire technique avec {sections.length} section{sections.length > 1 ? 's' : ''} et {questions.length} question{questions.length > 1 ? 's' : ''}.
            </p>
            <Button onClick={handleCreateMemoire} disabled={creating} className="gap-2">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer le mémoire
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

