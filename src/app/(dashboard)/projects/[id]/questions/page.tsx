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
import { Input } from '@/components/ui/input'
import { Loader2, FileText, CheckCircle2, ArrowRight, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { QuestionCard } from '@/components/template/QuestionCard'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { SecondaryBackLink } from '@/components/navigation/SecondaryBackLink'

interface ExtractedSection {
  id?: string
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
  const [addingQuestionToSection, setAddingQuestionToSection] = useState<number | null | -1>(null)
  const [addingSection, setAddingSection] = useState(false)
  const [newQuestionTitle, setNewQuestionTitle] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  const [deletingSection, setDeletingSection] = useState(false)
  const [associatedMemoire, setAssociatedMemoire] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    fetchTemplate()
  }, [projectId])

  useEffect(() => {
    if (template?.id) {
      fetchAssociatedMemoire(template.id)
    } else {
      setAssociatedMemoire(null)
    }
  }, [template?.id, projectId])

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

  const fetchAssociatedMemoire = async (templateDocumentId: string) => {
    try {
      const response = await fetch(`/api/memos?projectId=${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        // Trouver le mémoire associé au template courant
        const memoire = data.data.find((m: any) => m.templateDocumentId === templateDocumentId)
        if (memoire) {
          setAssociatedMemoire({ id: memoire.id, title: memoire.title })
        } else {
          setAssociatedMemoire(null)
        }
      }
    } catch (err) {
      // Erreur silencieuse, on continue sans afficher le bouton
      setAssociatedMemoire(null)
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

  const handleAddQuestion = async (sectionOrder: number | null) => {
    if (!template || !newQuestionTitle.trim()) return

    try {
      // Récupérer les questions depuis le template actuel
      const currentQuestions = template.questions || []
      const sectionQuestions = currentQuestions.filter((q: any) => {
        if (sectionOrder === null) {
          return q.sectionOrder === null || q.sectionOrder === undefined
        }
        return q.sectionOrder === sectionOrder
      })
      const maxOrder = sectionQuestions.length > 0 
        ? Math.max(...sectionQuestions.map((q: any) => q.order || 0)) 
        : 0
      const nextOrder = maxOrder + 1

      const response = await fetch('/api/template-questions/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: template.id,
          sectionOrder: sectionOrder,
          title: newQuestionTitle.trim(),
          order: nextOrder,
          questionType: 'TEXT',
          required: false,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Question ajoutée', 'La question a été ajoutée avec succès')
        setNewQuestionTitle('')
        setAddingQuestionToSection(null)
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'ajout')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible d\'ajouter la question')
    }
  }

  const handleAddSection = async () => {
    if (!template || !newSectionTitle.trim()) return

    try {
      // Récupérer les sections depuis le template actuel
      const currentSections = template.sections || []
      const maxOrder = currentSections.length > 0 ? Math.max(...currentSections.map((s: any) => s.order || 0)) : 0
      const nextOrder = maxOrder + 1

      const response = await fetch('/api/template-questions/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: template.id,
          title: newSectionTitle.trim(),
          order: nextOrder,
          required: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Section ajoutée', 'La section a été ajoutée avec succès')
        setNewSectionTitle('')
        setAddingSection(false)
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'ajout')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible d\'ajouter la section')
    }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down', sectionOrder: number | null) => {
    if (!template) return

    try {
      const currentQuestions = template.questions || []
      const sectionQuestions = currentQuestions
        .filter((q: any) => {
          if (sectionOrder === null) {
            return (q.sectionOrder === null || q.sectionOrder === undefined) && !q.parentQuestionOrder
          }
          return q.sectionOrder === sectionOrder && !q.parentQuestionOrder
        })
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

      const questionIndex = sectionQuestions.findIndex((q: any) => q.id === questionId)
      if (questionIndex === -1) return

      const question = sectionQuestions[questionIndex]
      let targetIndex: number

      if (direction === 'up') {
        if (questionIndex === 0) return // Déjà en haut
        targetIndex = questionIndex - 1
      } else {
        if (questionIndex === sectionQuestions.length - 1) return // Déjà en bas
        targetIndex = questionIndex + 1
      }

      const targetQuestion = sectionQuestions[targetIndex]

      // Échanger les ordres
      const tempOrder = question.order
      const newOrder = targetQuestion.order

      // Mettre à jour la question actuelle
      await fetch(`/api/template-questions/question/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })

      // Mettre à jour la question cible
      if (targetQuestion.id) {
        await fetch(`/api/template-questions/question/${targetQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: tempOrder }),
        })
      }

      // Si la question a des sous-questions, les déplacer aussi
      const subQuestions = currentQuestions.filter(
        (q: any) => q.parentQuestionOrder === question.order
      )
      if (subQuestions.length > 0) {
        // Calculer le décalage
        const offset = newOrder - tempOrder
        for (const subQ of subQuestions) {
          if (subQ.id) {
            await fetch(`/api/template-questions/question/${subQ.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                order: subQ.order + offset,
                parentQuestionOrder: newOrder, // Mettre à jour le parentQuestionOrder
              }),
            })
          }
        }
      }

      // Si la question cible a des sous-questions, les déplacer aussi
      const targetSubQuestions = currentQuestions.filter(
        (q: any) => q.parentQuestionOrder === targetQuestion.order
      )
      if (targetSubQuestions.length > 0) {
        const offset = tempOrder - newOrder
        for (const subQ of targetSubQuestions) {
          if (subQ.id) {
            await fetch(`/api/template-questions/question/${subQ.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                order: subQ.order + offset,
                parentQuestionOrder: tempOrder, // Mettre à jour le parentQuestionOrder
              }),
            })
          }
        }
      }

      toast.success('Question déplacée', 'La question a été réordonnée avec succès')
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de déplacer la question')
    }
  }

  const handleMoveSubQuestion = async (
    questionId: string, 
    direction: 'up' | 'down', 
    parentOrder: number,
    sectionOrder: number | null
  ) => {
    if (!template) return

    try {
      const currentQuestions = template.questions || []
      const subQuestions = currentQuestions
        .filter((q: any) => q.parentQuestionOrder === parentOrder)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

      const questionIndex = subQuestions.findIndex((q: any) => q.id === questionId)
      if (questionIndex === -1) return

      const question = subQuestions[questionIndex]
      let targetIndex: number

      if (direction === 'up') {
        if (questionIndex === 0) return
        targetIndex = questionIndex - 1
      } else {
        if (questionIndex === subQuestions.length - 1) return
        targetIndex = questionIndex + 1
      }

      const targetQuestion = subQuestions[targetIndex]

      // Échanger les ordres
      const tempOrder = question.order
      const newOrder = targetQuestion.order

      // Mettre à jour la question actuelle
      await fetch(`/api/template-questions/question/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })

      // Mettre à jour la question cible
      if (targetQuestion.id) {
        await fetch(`/api/template-questions/question/${targetQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: tempOrder }),
        })
      }

      toast.success('Question déplacée', 'La question a été réordonnée avec succès')
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de déplacer la question')
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      setDeletingSection(true)
      const response = await fetch(`/api/template-questions/section/${sectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Erreur HTTP: ${response.status}`)
      }

      toast.success('Section supprimée', 'La section a été supprimée avec succès')
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer la section')
    } finally {
      setDeletingSection(false)
      setSectionToDelete(null)
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
        // Mettre à jour l'état avec le nouveau mémoire créé
        setAssociatedMemoire({ id: data.data.id, title: data.data.title })
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
      <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
        {/* Header avec gradient - toujours en premier */}
        <ProjectHeader
          title="Questions extraites du template"
          subtitle="Aucune question extraite"
        />

        {/* Bouton retour - sous le header */}
        <div className="mb-2">
          <SecondaryBackLink href={`/projects/${projectId}/documents`}>
            Retour aux documents
          </SecondaryBackLink>
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
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Questions extraites du template"
        subtitle={`${template.name} • ${sections.length} section${sections.length > 1 ? 's' : ''} • ${questions.length} question${questions.length > 1 ? 's' : ''}`}
        primaryAction={
          <div className="flex gap-2">
            {template.companyForm && (
              <Link href={`/projects/${projectId}/company-form`}>
                <Button variant="outline" size="sm" className="gap-2" title="Informations globales utilisées dans l'introduction et l'en-tête du mémoire">
                  Informations de l'entreprise
                </Button>
              </Link>
            )}
            {associatedMemoire ? (
              <Link href={`/projects/${projectId}/memoire/${associatedMemoire.id}`}>
                <Button size="sm" className="gap-2">
                  Aller au mémoire associé
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={handleCreateMemoire} disabled={creating} className="gap-2">
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
            )}
          </div>
        }
      />

      {/* Bouton retour - sous le header */}
      <div className="mb-2">
        <SecondaryBackLink href={`/projects/${projectId}/documents`}>
          Retour aux documents
        </SecondaryBackLink>
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
          const allSectionQuestions = questionsBySection.get(section.order) || []
          // Toutes les questions sont normales (on n'utilise plus isGroupHeader)
          const normalQuestions = allSectionQuestions
          // Questions principales (sans parent) - incluant les headers de groupe - triées par order
          const mainQuestions = allSectionQuestions
            .filter((q: any) => !q.parentQuestionOrder)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          // Map des sous-questions par parentQuestionOrder (inclut les questions avec isGroupHeader comme parent)
          const subQuestionsMap = new Map<number, any[]>()
          allSectionQuestions.forEach((q: any) => {
            if (q.parentQuestionOrder !== null && q.parentQuestionOrder !== undefined) {
              if (!subQuestionsMap.has(q.parentQuestionOrder)) {
                subQuestionsMap.set(q.parentQuestionOrder, [])
              }
              subQuestionsMap.get(q.parentQuestionOrder)!.push(q)
            }
          })
          // Trier les sous-questions
          subQuestionsMap.forEach((subQs) => {
            subQs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          })
          
          return (
            <div key={section.id || section.order} className="space-y-3">
              {/* Titre de section */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {section.order}
                    </div>
                    <h2 className="font-semibold text-base flex-1">{section.title}</h2>
                    <Badge variant="secondary" className="ml-auto whitespace-nowrap">
                      {mainQuestions.length} question{mainQuestions.length > 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setAddingQuestionToSection(section.order)
                        setNewQuestionTitle('')
                      }}
                      title="Ajouter une question"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {section.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setSectionToDelete(section.id!)}
                        title="Supprimer cette section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Formulaire d'ajout de question */}
              {addingQuestionToSection === section.order && (
                <Card className="ml-4 border-dashed border-2">
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        placeholder="Texte de la question..."
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddQuestion(section.order)
                          } else if (e.key === 'Escape') {
                            setAddingQuestionToSection(null)
                            setNewQuestionTitle('')
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddQuestion(section.order)}
                        disabled={!newQuestionTitle.trim()}
                      >
                        Ajouter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingQuestionToSection(null)
                          setNewQuestionTitle('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Questions de la section */}
              <div className="space-y-2 ml-4">
                {mainQuestions.map((question: any, mainIndex: number) => {
                  const subQuestions = subQuestionsMap.get(question.order) || []
                  
                  return (
                    <div key={question.id || `${section.order}-${question.order}`}>
                      {/* Question principale */}
                      <QuestionCard
                        section={section}
                        question={question}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                      {/* Sous-questions avec indentation */}
                      {subQuestions.length > 0 && (
                        <div className="ml-8 space-y-2 mt-2">
                          {subQuestions.map((subQ: any, subIndex: number) => (
                            <QuestionCard
                              key={subQ.id || `${section.order}-${subQ.order}`}
                              section={section}
                              question={subQ}
                              onEdit={handleEditQuestion}
                              onDelete={handleDeleteQuestion}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {/* Questions sans section */}
        {questionsBySection.has(null) && (
          <div className="space-y-3">
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-base flex-1">Questions générales</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setAddingQuestionToSection(-1)
                        setNewQuestionTitle('')
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une question
                    </Button>
                  </div>
                </CardContent>
            </Card>
            
            {/* Formulaire d'ajout de question orpheline */}
            {addingQuestionToSection === -1 && (
              <Card className="ml-4 border-dashed border-2">
                <CardContent className="p-3">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Texte de la question..."
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddQuestion(null)
                        } else if (e.key === 'Escape') {
                          setAddingQuestionToSection(null)
                          setNewQuestionTitle('')
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddQuestion(null)}
                      disabled={!newQuestionTitle.trim()}
                    >
                      Ajouter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingQuestionToSection(null)
                        setNewQuestionTitle('')
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2 ml-4">
              {questionsBySection.get(null)!
                .filter((q: any) => !q.parentQuestionOrder)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((question: any, index: number) => (
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
        
        {/* Bouton pour ajouter une nouvelle section */}
        <div className="flex justify-center">
          <Card className="bg-primary/5 border-primary/20 w-fit">
            <CardContent className="p-3">
              {!addingSection ? (
                <Button
                  variant="ghost"
                  className="justify-center gap-2"
                  onClick={() => {
                    setAddingSection(true)
                    setNewSectionTitle('')
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une nouvelle section
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="w-64"
                    placeholder="Titre de la section (ex: ITEM 7: Nouvelle section)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSection()
                      } else if (e.key === 'Escape') {
                        setAddingSection(false)
                        setNewSectionTitle('')
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSection}
                    disabled={!newSectionTitle.trim()}
                  >
                    Ajouter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingSection(false)
                      setNewSectionTitle('')
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Vous pouvez maintenant créer votre mémoire technique avec {sections.length} section{sections.length > 1 ? 's' : ''} et {questions.length} question{questions.length > 1 ? 's' : ''}.
            </p>
            {associatedMemoire ? (
              <Link href={`/projects/${projectId}/memoire/${associatedMemoire.id}`}>
                <Button size="sm" className="gap-2">
                  Aller au mémoire associé
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={handleCreateMemoire} disabled={creating} className="gap-2">
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression de section */}
      <ConfirmDeleteDialog
        open={!!sectionToDelete}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        title="Supprimer cette section ?"
        description="Cette action est irréversible. Cette section et toutes les questions associées seront définitivement supprimées."
        itemName={sectionToDelete ? sections.find((s) => s.id === sectionToDelete)?.title : undefined}
        onConfirm={() => sectionToDelete && handleDeleteSection(sectionToDelete)}
        deleting={deletingSection}
        confirmLabel="Supprimer définitivement"
      />
    </div>
  )
}

