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
import { Loader2, FileText, CheckCircle2, ArrowRight, AlertCircle, Plus, Trash2, ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { QuestionCard } from '@/components/template/QuestionCard'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

interface ExtractedQuestion {
  id?: string
  sectionOrder?: number | null
  order: number
  title: string
  questionType?: string
  required?: boolean
  parentQuestionOrder?: number | null
  isGroupHeader?: boolean
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
  questions?: ExtractedQuestion[]
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
  
  // Modal création mémoire
  const [showCreateMemoireModal, setShowCreateMemoireModal] = useState(false)
  const [newMemoireTitle, setNewMemoireTitle] = useState('')
  
  // Modal effacer toutes les questions
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

  // Extraction des questions
  const [extracting, setExtracting] = useState(false)

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

  // Initialiser le titre du mémoire quand le template est chargé
  useEffect(() => {
    if (template && !newMemoireTitle) {
      setNewMemoireTitle(`Mémoire - ${template.name || 'v1'}`)
    }
  }, [template, newMemoireTitle])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      
      // Récupérer le template (inclut maintenant les questions depuis la BDD)
      const templateResponse = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const templateData = await templateResponse.json()

      if (!templateData.success || !templateData.data) {
        // Pas de template : on laisse le composant afficher l'état vide
        setTemplate(null)
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
      // En cas d'erreur, on laisse le composant afficher l'état vide
      setTemplate(null)
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
        toast.success('Question mise à jour', { description: 'La question a été modifiée avec succès' })
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de mettre à jour la question' })
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/template-questions/question/${questionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Question supprimée', { description: 'La question a été supprimée avec succès' })
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer la question' })
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
        toast.success('Question ajoutée', { description: 'La question a été ajoutée avec succès' })
        setNewQuestionTitle('')
        setAddingQuestionToSection(null)
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'ajout')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible d\'ajouter la question' })
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
        toast.success('Section ajoutée', { description: 'La section a été ajoutée avec succès' })
        setNewSectionTitle('')
        setAddingSection(false)
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'ajout')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible d\'ajouter la section' })
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

      toast.success('Question déplacée', { description: 'La question a été réordonnée avec succès' })
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de déplacer la question' })
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

      toast.success('Question déplacée', { description: 'La question a été réordonnée avec succès' })
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de déplacer la question' })
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

      toast.success('Section supprimée', { description: 'La section a été supprimée avec succès' })
      await fetchTemplate()
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer la section' })
    } finally {
      setDeletingSection(false)
      setSectionToDelete(null)
    }
  }

  const handleCreateMemoire = async (customTitle?: string) => {
    if (!template) return

    try {
      setCreating(true)
      const title = customTitle || newMemoireTitle || `Mémoire - ${template.name || 'v1'}`
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateDocumentId: template.id,
          title,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateMemoireModal(false)
        toast.success('Mémoire créé', { description: 'Votre mémoire technique a été créé avec succès' })
        // Toujours rediriger vers le mémoire créé
        router.push(`/projects/${projectId}/memoire/${data.data.id}`)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de créer le mémoire' })
    } finally {
      setCreating(false)
    }
  }

  const handleClearAllQuestions = async () => {
    try {
      setClearingAll(true)
      const response = await fetch(`/api/template-questions/clear?projectId=${projectId}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => ({ success: false, error: { message: 'Erreur serveur' } }))

      if (data.success) {
        // Fermer le dialog d'abord
        setShowClearAllDialog(false)
        setClearingAll(false)

        toast.success('Questions effacées', { description: `${data.data.deletedQuestions} question(s) et ${data.data.deletedSections} section(s) supprimées` })

        // Rediriger vers la page documents car il n'y a plus de questions
        router.push(`/projects/${projectId}/documents`)
      } else {
        // Cas spécial : conflit avec mémoires existants (warning orange, pas erreur rouge)
        if (data.error?.code === 'MEMOS_HAVE_CONTENT') {
          setShowClearAllDialog(false)
          toast.warning(data.error.title || 'Attention', {
            description: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#b45309' }}>
                <span>{data.error.message}</span>
                <span style={{ fontWeight: 500 }}>{data.error.action}</span>
              </div>
            ),
            duration: 8000, // Plus long pour laisser le temps de lire
          })
        } else {
          throw new Error(data.error?.message || 'Erreur lors de la suppression')
        }
      }
    } catch (err) {
      console.error('Error clearing questions:', err)
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer les questions' })
      setShowClearAllDialog(false)
    } finally {
      setClearingAll(false)
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

  const handleExtractQuestions = async () => {
    if (!template) {
      router.push(`/projects/${projectId}/documents`)
      return
    }

    try {
      setExtracting(true)
      const response = await fetch('/api/memoire/template/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Questions extraites', { description: 'Les questions ont été extraites avec succès' })
        await fetchTemplate()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'extraction')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible d\'extraire les questions' })
    } finally {
      setExtracting(false)
    }
  }

  if (!template || !template.questions || template.questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
        {/* Header avec gradient - toujours en premier */}
        <ProjectHeader
          title="Exigences"
          subtitle="Aucune exigence extraite"
        />

        {/* Bouton retour - sous le header avec espacement uniforme */}
        <div className="mt-2">
          <HeaderLinkButton
            href={`/projects/${projectId}/documents`}
            icon={<ArrowLeft className="h-4 w-4" />}
            variant="ghost"
            size="sm"
          >
            Retour aux documents
          </HeaderLinkButton>
        </div>
        <Card data-tutorial="questions-list" data-has-questions="false">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune question extraite</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {template
                ? 'Extrayez les questions du template pour commencer.'
                : 'Vous devez d\'abord uploader un template mémoire.'}
            </p>
            {template ? (
              <Button
                size="sm"
                className="gap-2"
                disabled={extracting}
                onClick={handleExtractQuestions}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extraction...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extraire les questions
                  </>
                )}
              </Button>
            ) : (
              <Link href={`/projects/${projectId}/documents`}>
                <Button size="sm" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Aller aux documents
                </Button>
              </Link>
            )}
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
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4" data-tutorial="questions-list" data-has-questions="true">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Questions extraites du template"
        subtitle={`${template.name} • ${sections.length} section${sections.length > 1 ? 's' : ''} • ${questions.length} question${questions.length > 1 ? 's' : ''}`}
      />

      {/* Boutons de navigation - sous le header avec espacement uniforme */}
      <div className="flex items-center justify-between mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}/documents`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour aux documents
        </HeaderLinkButton>
        {associatedMemoire && (
          <Link href={`/projects/${projectId}/memoire/${associatedMemoire.id}`} data-tutorial="go-memoire-btn">
            <Button size="sm" className="gap-2">
              Aller au mémoire
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Bloc de liaison questions ↔ mémoire */}
      <Card className={associatedMemoire ? "border-green-200/50 bg-green-50/30" : "border-blue-200 bg-blue-50/60"}>
        <CardContent className="p-4">
          {associatedMemoire ? (
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Ces questions alimentent le mémoire : <span className="font-medium text-foreground">{associatedMemoire.title}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Aucun mémoire associé pour l'instant
                  </p>
                  <p className="text-xs text-blue-600">
                    Créez un mémoire pour répondre aux {questions.length} questions extraites.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowCreateMemoireModal(true)}
                disabled={creating}
                data-tutorial="go-memoire-btn"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    Créer un mémoire
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton effacer toutes les questions - sous le bloc vert, aligné à droite */}
      <div className="flex justify-end">
        <HeaderLinkButton
          onClick={() => setShowClearAllDialog(true)}
          icon={<Trash2 className="h-4 w-4" />}
          variant="destructive-outline"
          size="sm"
        >
          Effacer toutes les questions
        </HeaderLinkButton>
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
      <div className="space-y-6" data-tutorial="questions-list">
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
              <Card className="bg-primary/5 border-0">
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
            <Card className="bg-primary/5 border-0">
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
          <Card className="bg-primary/5 border-0 w-fit">
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

      {/* Modal de création de mémoire */}
      <Dialog open={showCreateMemoireModal} onOpenChange={setShowCreateMemoireModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un mémoire technique</DialogTitle>
            <DialogDescription>
              Un mémoire sera créé à partir des {questions.length} question{questions.length > 1 ? 's' : ''} extraite{questions.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="memoire-title" className="text-sm font-medium text-foreground">
                Titre du mémoire
              </label>
              <Input
                id="memoire-title"
                value={newMemoireTitle}
                onChange={(e) => setNewMemoireTitle(e.target.value)}
                placeholder="Mémoire généré - v0"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCreateMemoireModal(false)}
              disabled={creating}
            >
              Plus tard
            </Button>
            <Button
              onClick={() => handleCreateMemoire()}
              disabled={creating || !newMemoireTitle.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                'Créer le mémoire'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog pour effacer toutes les questions */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer toutes les questions extraites ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les questions et sections extraites seront définitivement supprimées.
              Vous devrez ré-extraire les questions à partir du template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingAll}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllQuestions}
              disabled={clearingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

