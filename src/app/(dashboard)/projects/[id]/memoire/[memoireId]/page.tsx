/**
 * Page d'édition d'un mémoire technique
 * Layout 3 colonnes : sections + éditeur + IA
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  ArrowLeft,
  Download,
  CheckCircle2,
  GitBranch,
  FileText,
  FileDown,
  Info,
  Copy,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { isDocxCompatible, isPdfTemplate, EXPORT_MESSAGES } from '@/lib/utils/docx-placeholders'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { AIPanel } from '@/components/memoire/AIPanel'
import { SectionsList, type GenerationPhase } from '@/components/memoire/SectionsList'
import { SectionEditor } from '@/components/memoire/SectionEditor'
import { CompanyProfileWarning } from '@/components/memoire/CompanyProfileWarning'
import { RequirementsExtractionWarning } from '@/components/memoire/RequirementsExtractionWarning'
import { MemoireVersionControl } from '@/components/memoire/MemoireVersionControl'
import { SectionComments } from '@/components/memoire/SectionComments'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import { ExportReportModal, InjectionReport } from '@/components/memoire/ExportReportModal'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DesyncChoiceModal } from '@/components/memoire/DesyncChoiceModal'
import { Sparkles } from 'lucide-react'

interface Memoire {
  id: string
  title: string
  status: string
  versionNumber?: number
  isFrozen?: boolean
  parentMemoireId?: string | null
  templateDocumentId?: string
  project: {
    id: string
    name: string
  }
  template?: {
    id: string
    name: string
    mimeType?: string
  }
}

interface MemoireSection {
  id: string
  title: string
  order: number
  question?: string
  status: string
  content?: string
  itemId?: string | null
  itemTitle?: string | null
  itemOrder?: number | null
}

interface Item {
  id: string
  title: string
  order: number
}

export default function MemoireEditorPage({
  params,
}: {
  params: { id: string; memoireId: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const memoireId = params.memoireId

  const [memoire, setMemoire] = useState<Memoire | null>(null)
  const [sections, setSections] = useState<MemoireSection[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'CONTRIBUTOR' | 'REVIEWER' | null>(null)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [sectionIdForComments, setSectionIdForComments] = useState<string | null>(null)
  const [sectionsCommentsCount, setSectionsCommentsCount] = useState<Record<string, number>>({})
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState<string>('')
  const [hasTemplateQuestions, setHasTemplateQuestions] = useState(false)
  const [hasCompanyForm, setHasCompanyForm] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showExportReport, setShowExportReport] = useState(false)
  const [exportReport, setExportReport] = useState<InjectionReport | null>(null)
  const [exportedFile, setExportedFile] = useState<{ exportId: string; fileName: string } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [generatingIndex, setGeneratingIndex] = useState<number | undefined>(undefined)
  const [showGenerateAllDialog, setShowGenerateAllDialog] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [shouldStop, setShouldStop] = useState(false)
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'planning' | 'generating'>('idle')
  const [currentItemTitle, setCurrentItemTitle] = useState<string>('')
  const [syncStatus, setSyncStatus] = useState<{
    isSync: boolean
    templateQuestionsCount: number
    memoireSectionsCount: number
    orphanSections: number
  } | null>(null)
  const [showDesyncModal, setShowDesyncModal] = useState(false)
  const [desyncDismissed, setDesyncDismissed] = useState(false)
  const [staleSections, setStaleSections] = useState<Array<{
    sectionId: string
    isStale: boolean
    wasGeneratedByAI: boolean
    changes: Array<{ type: string; label: string }>
  }>>([])

  const debouncedContent = useDebounce(sectionContent, 800)

  // Charger le mémoire et ses sections
  useEffect(() => {
    if (memoireId) {
      fetchMemoire()
      fetchSections()
      fetchUserRole()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoireId])

  // Vérifier si le template a des questions extraites et un formulaire entreprise
  useEffect(() => {
    if (memoire?.templateDocumentId) {
      checkTemplateQuestions()
      checkCompanyForm()
      checkSyncStatus()
    } else {
      setHasTemplateQuestions(false)
      setHasCompanyForm(false)
      setSyncStatus(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoire?.templateDocumentId, sections.length])

  // Vérifier la fraîcheur des sections (détection des réponses obsolètes)
  useEffect(() => {
    if (memoireId && sections.length > 0) {
      fetchStaleness()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoireId, sections.length])

  const fetchStaleness = async () => {
    try {
      const response = await fetch(`/api/memos/${memoireId}/staleness`)
      const data = await response.json()
      if (data.success && data.data?.sections) {
        setStaleSections(data.data.sections)
      }
    } catch (err) {
      console.error('Error fetching staleness:', err)
      // Ignorer silencieusement les erreurs de fraîcheur
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      const data = await response.json()
      if (data.success && data.data) {
        // Trouver le rôle de l'utilisateur connecté (via session)
        const sessionResponse = await fetch('/api/auth/session')
        const session = await sessionResponse.json()
        if (session?.user?.id) {
          const member = data.data.find((m: any) => m.userId === session.user.id)
          setUserRole(member?.role || 'OWNER') // Par défaut OWNER si pas trouvé (propriétaire du projet)
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
      // Par défaut OWNER si erreur
      setUserRole('OWNER')
    }
  }

  // Charger le contenu de la section sélectionnée quand on change de section
  // Utilise une ref pour éviter de déclencher l'autosave lors du changement de section
  useEffect(() => {
    if (selectedSectionId && sections.length > 0) {
      const section = sections.find((s) => s.id === selectedSectionId)
      if (section) {
        // S'assurer que le contenu est toujours une string, même si null ou undefined
        const content = section.content ?? ''
        // Charger immédiatement le contenu de la nouvelle section
        setSectionContent(content)
        setLastSavedContent(content)
        setSaved(true) // La section vient d'être chargée, elle est "sauvée" par défaut
      }
    } else if (!selectedSectionId) {
      // Si aucune section n'est sélectionnée, réinitialiser le contenu
      setSectionContent('')
      setLastSavedContent('')
    }
  }, [selectedSectionId, sections]) // Inclure sections pour réagir au chargement initial

  // Autosave sur debounce - seulement si le contenu a changé
  useEffect(() => {
    if (
      selectedSectionId &&
      debouncedContent !== undefined &&
      debouncedContent !== null &&
      debouncedContent !== lastSavedContent // Ne sauvegarder que si le contenu a réellement changé
    ) {
      saveSectionContent()
    }
  }, [debouncedContent]) // Ne réagir qu'au changement de contenu débounced, pas au changement de section

  const fetchMemoire = async () => {
    try {
      const response = await fetch(`/api/memos/${memoireId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setMemoire(data.data)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      toast.error('Erreur lors du chargement du mémoire')
      console.error('Error fetching memoire:', err)
    }
  }

  const checkTemplateQuestions = async () => {
    if (!memoire?.templateDocumentId) return

    try {
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        // Vérifier si le template est parsé et a des questions
        const template = data.data
        const hasQuestions = template.status === 'PARSED' && 
                            template.questions && 
                            template.questions.length > 0
        setHasTemplateQuestions(hasQuestions)
      } else {
        setHasTemplateQuestions(false)
      }
    } catch (err) {
      // Erreur silencieuse, on n'affiche pas le lien
      setHasTemplateQuestions(false)
    }
  }

  const checkCompanyForm = async () => {
    if (!memoire?.templateDocumentId) return

    try {
      const response = await fetch(`/api/template-company-form/${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setHasCompanyForm(true)
      } else {
        setHasCompanyForm(false)
      }
    } catch (err) {
      // Erreur silencieuse, on n'affiche pas le lien
      setHasCompanyForm(false)
    }
  }

  // Vérifier la synchronisation entre le mémoire et le template
  const checkSyncStatus = async () => {
    if (!memoire?.templateDocumentId || sections.length === 0) {
      setSyncStatus(null)
      return
    }

    try {
      // Récupérer les questions du template
      const response = await fetch(`/api/template-questions?projectId=${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        const templateQuestions = data.data.filter((q: any) => !q.isGroupHeader)
        const templateQuestionsCount = templateQuestions.length

        // Compter les sections orphelines (celles dont le titre ne correspond à aucune question)
        const templateTitles = new Set(
          templateQuestions.map((q: any) => q.title?.trim().toLowerCase())
        )
        const orphanSections = sections.filter(s => {
          const sectionTitle = (s.question || s.title)?.trim().toLowerCase()
          return !templateTitles.has(sectionTitle)
        }).length

        const isSync = templateQuestionsCount === sections.length && orphanSections === 0

        setSyncStatus({
          isSync,
          templateQuestionsCount,
          memoireSectionsCount: sections.length,
          orphanSections,
        })

        // Ouvrir le modal automatiquement si désync détectée et pas encore ignorée
        if (!isSync && !desyncDismissed) {
          setShowDesyncModal(true)
        }
      }
    } catch (err) {
      console.error('Error checking sync status:', err)
      setSyncStatus(null)
    }
  }

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memos/${memoireId}/sections`)
      const data = await response.json()

      if (data.success && data.data) {
        // Support ancien format (array) et nouveau format (object avec sections et items)
        const sectionsArray = Array.isArray(data.data) ? data.data : (data.data.sections || [])
        const itemsArray = Array.isArray(data.data) ? [] : (data.data.items || [])
        const sortedSections = [...sectionsArray].sort((a, b) => a.order - b.order)
        // Normaliser le contenu pour s'assurer qu'il est toujours une string
        const normalizedSections = sortedSections.map((s: any) => ({
          ...s,
          content: s.content ?? '',
        }))
        setSections(normalizedSections)
        setItems(itemsArray)

        // Charger le contenu de la section sélectionnée si une section est déjà sélectionnée
        if (normalizedSections.length > 0 && selectedSectionId) {
          const selectedSection = normalizedSections.find((s: any) => s.id === selectedSectionId)
          if (selectedSection) {
            const content = selectedSection.content ?? ''
            setSectionContent(content)
            setLastSavedContent(content)
          }
        } else if (normalizedSections.length > 0 && !selectedSectionId) {
          // Sélectionner la première section par défaut si aucune n'est sélectionnée
          const firstSectionId = normalizedSections[0].id
          setSelectedSectionId(firstSectionId)
          const firstSection = normalizedSections[0]
          const content = firstSection.content ?? ''
          setSectionContent(content)
          setLastSavedContent(content)
        }

        // Charger le nombre de commentaires pour chaque section
        const commentsCounts: Record<string, number> = {}
        await Promise.all(
          normalizedSections.map(async (section: any) => {
            try {
              const commentsResponse = await fetch(`/api/sections/${section.id}/comments`)
              const commentsData = await commentsResponse.json()
              if (commentsData.success && commentsData.data) {
                // Compter tous les commentaires (y compris les réponses)
                const countAllComments = (comments: any[]): number => {
                  return comments.reduce((total, comment) => {
                    return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
                  }, 0)
                }
                commentsCounts[section.id] = countAllComments(commentsData.data)
              } else {
                commentsCounts[section.id] = 0
              }
            } catch (err) {
              commentsCounts[section.id] = 0
            }
          })
        )
        setSectionsCommentsCount(commentsCounts)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des sections')
      console.error('Error fetching sections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecreateSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memos/${memoireId}/recreate-sections`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Sections recréées', { description: 'Les sections ont été recréées à partir du template' })
        await fetchSections()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la recréation')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de recréer les sections' })
    } finally {
      setLoading(false)
    }
  }

  const saveSectionContent = async () => {
    if (!selectedSectionId) return

    try {
      setSaving(true)
      const currentSection = sections.find((s) => s.id === selectedSectionId)
      const newStatus = currentSection?.status === 'DRAFT' && sectionContent.trim() 
        ? 'IN_PROGRESS' 
        : currentSection?.status

      const response = await fetch(
        `/api/memos/${memoireId}/sections/${selectedSectionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: sectionContent,
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        // Mettre à jour la section dans la liste
        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSectionId
              ? { ...s, content: sectionContent || '', status: newStatus || s.status }
              : s
          )
        )
        setLastSavedContent(sectionContent || '') // CRITIQUE : Mémoriser le contenu sauvegardé
        setSaved(true)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde')
      console.error('Error saving section:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNewVersion = async () => {
    if (!memoire) return

    try {
      setCreatingVersion(true)
      const currentVersionNumber = memoire.versionNumber || 1
      const response = await fetch(`/api/memos/${memoireId}/versions`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success && data.data) {
        const newVersionNumber = data.data.versionNumber
        toast.success('Nouvelle version créée', {
          description: `Version V${newVersionNumber} créée à partir de V${currentVersionNumber}. Toutes les réponses ont été dupliquées.`,
        })
        // Rediriger vers la nouvelle version
        window.location.href = window.location.pathname.replace(memoireId, data.data.id)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création de la version')
    } finally {
      setCreatingVersion(false)
      setShowNewVersionDialog(false)
    }
  }

  const handleExportDocx = async () => {
    if (!memoire) return

    try {
      setExporting(true)

      const response = await fetch(`/api/memos/${memoireId}/export-docx`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Erreur lors de l\'export')
      }

      // Stocker les infos de l'export
      const exportedFileData = {
        exportId: data.data.exportId,
        fileName: data.data.fileName,
      }
      setExportedFile(exportedFileData)
      setExportReport(data.data.report)

      // Télécharger automatiquement via l'API
      const downloadUrl = `/api/exports/${data.data.exportId}/download`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = data.data.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export terminé', { description: `Téléchargement de ${data.data.fileName} en cours...` })

      // Ouvrir le modal de rapport pour les détails
      setShowExportReport(true)

    } catch (err) {
      toast.error('Erreur d\'export', { description: err instanceof Error ? err.message : 'Impossible de générer le DOCX' })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteMemo = async () => {
    if (!memoire) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/memos/${memoireId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }

      toast.success('Mémoire supprimé', { description: 'Le mémoire technique a été supprimé avec succès' })
      router.push(`/projects/${projectId}/documents`)
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer le mémoire' })
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadExportedFile = () => {
    if (!exportedFile) return

    // Télécharger via l'API
    const downloadUrl = `/api/exports/${exportedFile.exportId}/download`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = exportedFile.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Téléchargement', { description: `${exportedFile.fileName} en cours...` })
  }

  const handleUpdateStatus = async (newStatus: 'DRAFT' | 'IN_PROGRESS' | 'REVIEWED' | 'VALIDATED') => {
    if (!selectedSectionId) return

    try {
      // Sauvegarder le contenu ET le statut en même temps
      const response = await fetch(
        `/api/memos/${memoireId}/sections/${selectedSectionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: sectionContent || '', // Inclure le contenu actuel (toujours une string)
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        // Mettre à jour la section dans la liste avec le contenu ET le statut
        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSectionId 
              ? { ...s, status: newStatus, content: sectionContent || '' }
              : s
          )
        )
        setLastSavedContent(sectionContent) // Mémoriser le contenu sauvegardé
        setSaved(true) // Marquer comme sauvegardé
        
        const statusLabels: Record<string, string> = {
          DRAFT: 'Brouillon',
          IN_PROGRESS: 'À relire',
          REVIEWED: 'Relu',
          VALIDATED: 'Validé',
        }
        toast.success(`Statut mis à jour : ${statusLabels[newStatus]}`)
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      console.error('Error updating status:', err)
    }
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  // Ouvre le modal de confirmation pour générer toutes les réponses
  const handleGenerateAllClick = () => {
    if (isGeneratingAll || sections.length === 0) return
    setShowGenerateAllDialog(true)
  }

  // Fonction utilitaire pour attendre pendant la pause
  const waitWhilePaused = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const checkPause = () => {
        // Vérifier si on doit arrêter
        if (shouldStop) {
          resolve(false) // Retourne false pour indiquer qu'on doit arrêter
          return
        }
        // Vérifier si on est en pause
        if (isPaused) {
          setTimeout(checkPause, 100) // Vérifier toutes les 100ms
        } else {
          resolve(true) // Continuer
        }
      }
      checkPause()
    })
  }

  // Génération en masse de toutes les réponses (par item avec planification)
  const handleGenerateAll = async () => {
    setShowGenerateAllDialog(false)
    setIsGeneratingAll(true)
    setIsPaused(false)
    setShouldStop(false)
    setGenerationPhase('idle')
    setCurrentItemTitle('')
    let generatedCount = 0
    let errorCount = 0

    try {
      // Grouper les sections par item (chapitre)
      const sectionsByItem = new Map<string, MemoireSection[]>()
      const sectionsWithoutItem: MemoireSection[] = []

      for (const section of sections) {
        // Filtrer : ne garder que les sections vides ou en brouillon
        const shouldGenerate = !section.content?.trim() || section.status === 'DRAFT'
        if (!shouldGenerate) continue

        if (section.itemId) {
          const existing = sectionsByItem.get(section.itemId) || []
          existing.push(section)
          sectionsByItem.set(section.itemId, existing)
        } else {
          sectionsWithoutItem.push(section)
        }
      }

      // Traiter chaque item avec la génération par lot (2 phases)
      for (const [itemId, itemSections] of sectionsByItem) {
        // Vérifier pause/stop avant chaque item
        const shouldContinue = await waitWhilePaused()
        if (!shouldContinue || shouldStop) {
          toast.info('Génération arrêtée', { description: `${generatedCount} réponses générées` })
          break
        }

        const itemTitle = itemSections[0]?.itemTitle || 'Chapitre'
        setCurrentItemTitle(itemTitle)

        try {
          // Phase 1 : Planification
          setGenerationPhase('planning')

          const response = await fetch('/api/ia/section-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              memoireId,
              sectionIds: itemSections.map(s => s.id),
              itemId,
              itemTitle,
              responseLength: 'standard',
            }),
          })

          const data = await response.json()

          if (data.success && data.data?.results) {
            // Phase 2 : Appliquer les résultats
            setGenerationPhase('generating')

            for (let i = 0; i < data.data.results.length; i++) {
              const result = data.data.results[i]
              const section = itemSections.find(s => s.id === result.sectionId)
              if (!section) continue

              // Vérifier pause/stop
              const continueGeneration = await waitWhilePaused()
              if (!continueGeneration || shouldStop) break

              // Trouver l'index global pour l'UI
              const globalIndex = sections.findIndex(s => s.id === result.sectionId)
              setGeneratingIndex(globalIndex)
              setSelectedSectionId(result.sectionId)

              if (result.success && result.content) {
                // Mettre à jour le contenu
                setSectionContent(result.content)

                // Sauvegarder
                const saveResponse = await fetch(
                  `/api/memos/${memoireId}/sections/${result.sectionId}`,
                  {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      content: result.content,
                      status: 'IN_PROGRESS',
                    }),
                  }
                )

                if (saveResponse.ok) {
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === result.sectionId
                        ? { ...s, content: result.content, status: 'IN_PROGRESS' }
                        : s
                    )
                  )
                  setLastSavedContent(result.content)
                  generatedCount++
                }
              } else {
                errorCount++
                console.error(`Error for section ${result.sectionId}:`, result.error)
              }
            }
          } else {
            errorCount += itemSections.length
            console.error('Batch generation failed:', data.error)
          }
        } catch (err) {
          errorCount += itemSections.length
          console.error(`Error generating item ${itemId}:`, err)
        }
      }

      // Traiter les sections sans item (mode classique)
      for (let i = 0; i < sectionsWithoutItem.length; i++) {
        const shouldContinue = await waitWhilePaused()
        if (!shouldContinue || shouldStop) break

        const section = sectionsWithoutItem[i]
        const globalIndex = sections.findIndex(s => s.id === section.id)
        setGeneratingIndex(globalIndex)
        setSelectedSectionId(section.id)
        setCurrentItemTitle('')
        setGenerationPhase('generating')

        try {
          const response = await fetch('/api/ia/section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              memoireId,
              sectionId: section.id,
              actionType: 'complete',
              responseLength: 'standard',
            }),
          })

          const data = await response.json()

          if (data.success && data.data?.resultText) {
            const generatedText = data.data.resultText
            setSectionContent(generatedText)

            const saveResponse = await fetch(
              `/api/memos/${memoireId}/sections/${section.id}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: generatedText,
                  status: 'IN_PROGRESS',
                }),
              }
            )

            if (saveResponse.ok) {
              setSections((prev) =>
                prev.map((s) =>
                  s.id === section.id
                    ? { ...s, content: generatedText, status: 'IN_PROGRESS' }
                    : s
                )
              )
              setLastSavedContent(generatedText)
              generatedCount++
            }
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
          console.error(`Error generating section ${section.id}:`, err)
        }
      }

      // Afficher le résumé
      if (!shouldStop) {
        if (errorCount === 0) {
          toast.success('Génération terminée', { description: `${generatedCount} réponses générées avec succès` })
        } else {
          toast.warning('Génération terminée', { description: `${generatedCount} réponses générées, ${errorCount} erreurs` })
        }
      }
    } finally {
      setIsGeneratingAll(false)
      setGeneratingIndex(undefined)
      setIsPaused(false)
      setShouldStop(false)
      setGenerationPhase('idle')
      setCurrentItemTitle('')
    }
  }

  // Contrôles de génération
  const handlePauseGeneration = () => setIsPaused(true)
  const handleResumeGeneration = () => setIsPaused(false)
  const handleStopGeneration = () => {
    setShouldStop(true)
    setIsPaused(false) // Débloquer la boucle si en pause
  }

  // Si aucune section et que le chargement est terminé, proposer de recréer
  const showRecreateButton = !loading && sections.length === 0 && memoire

  if (loading && !memoire) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!memoire) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Mémoire introuvable</p>
      </div>
    )
  }

  // Utiliser le titre réel du mémoire
  const memoireTitle = memoire.title

  // Construire le subtitle avec les badges
  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    IN_PROGRESS: 'En cours',
    READY: 'Prêt',
    EXPORTED: 'Exporté',
    REVIEWED: 'Relu',
    VALIDATED: 'Validé',
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-full mx-auto space-y-4 px-4 py-4">
          {/* Header avec gradient - toujours en premier */}
          <ProjectHeader
            title={memoireTitle}
            subtitle={
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  V{memoire.versionNumber || 1}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {statusLabels[memoire.status] || memoire.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {memoire.project.name}
                </span>
              </div>
            }
            primaryAction={
              <div className="flex items-center gap-2">
                {!memoire.isFrozen && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowNewVersionDialog(true)}
                      disabled={creatingVersion}
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      Nouvelle version
                    </Button>
                    <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Créer une nouvelle version ?</DialogTitle>
                          <DialogDescription className="pt-2">
                            Une nouvelle version (V{(memoire.versionNumber || 1) + 1}) sera créée à partir de la version actuelle (V{memoire.versionNumber || 1}).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                          <p className="text-sm text-foreground font-medium">Ce qui sera copié :</p>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>La structure complète des questions</li>
                            <li>Toutes les réponses existantes</li>
                            <li>L'organisation des sections</li>
                          </ul>
                          <p className="text-sm text-muted-foreground pt-2">
                            La version actuelle (V{memoire.versionNumber || 1}) sera <strong>figée</strong> et ne pourra plus être modifiée, mais restera consultable.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowNewVersionDialog(false)} disabled={creatingVersion}>
                            Annuler
                          </Button>
                          <Button onClick={handleCreateNewVersion} disabled={creatingVersion}>
                            {creatingVersion ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Création...
                              </>
                            ) : (
                              <>
                                <GitBranch className="h-4 w-4 mr-2" />
                                Créer la version V{(memoire.versionNumber || 1) + 1}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {/* Bouton Export DOCX - conditionnel selon compatibilité */}
                {isDocxCompatible(memoire.template?.mimeType) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDocx}
                    disabled={exporting || sections.length === 0}
                    title={sections.length === 0 
                      ? "Aucune section à exporter" 
                      : "Exporter le mémoire avec les réponses injectées"
                    }
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Exporter DOCX rempli
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title={isPdfTemplate(memoire.template?.mimeType) 
                      ? "Template PDF - copier-coller requis" 
                      : "Aucun template associé"
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                )}
                {/* Bouton de suppression */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            }
          />

          {/* Boutons retour et actions secondaires - sous le header avec espacement uniforme */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <HeaderLinkButton
                href={`/projects/${projectId}/questions`}
                icon={<ArrowLeft className="h-4 w-4" />}
                variant="ghost"
                className="h-8 text-xs"
              >
                Retour aux questions extraites
              </HeaderLinkButton>
            </div>
          </div>

          {/* Indicateur de compatibilité DOCX */}
          {memoire.template && (
            <div>
              {isDocxCompatible(memoire.template.mimeType) ? (
                <Card className="border-green-200/50 bg-green-50/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Compatible injection DOCX <FileText className="h-3 w-3 inline-block ml-0.5 align-middle" /></span> — {EXPORT_MESSAGES.DOCX_COMPATIBLE.description}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : isPdfTemplate(memoire.template.mimeType) ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>{EXPORT_MESSAGES.PDF_ONLY.title}</strong> — {EXPORT_MESSAGES.PDF_ONLY.description}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs"
                    onClick={() => {
                      // Future: ouvrir un guide de copier-coller
                      toast.info('Fonctionnalité', { description: 'Guide de copier-coller à venir.' })
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier les réponses
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Warning profil entreprise */}
          <div>
            <CompanyProfileWarning />
          </div>

          {/* Warning extraction des exigences en cours */}
          <RequirementsExtractionWarning projectId={projectId} />

          {/* Warning désynchronisation template (banner compact, le modal s'affiche automatiquement) */}
          {syncStatus && !syncStatus.isSync && desyncDismissed && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Mémoire désynchronisé du template</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs ml-auto"
                onClick={() => setShowDesyncModal(true)}
              >
                Voir les options
              </Button>
            </div>
          )}

          {/* Warning sections obsolètes (contexte de génération modifié) */}
          {staleSections.filter(s => s.isStale).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">
                  {staleSections.filter(s => s.isStale).length} réponse{staleSections.filter(s => s.isStale).length > 1 ? 's' : ''} potentiellement obsolète{staleSections.filter(s => s.isStale).length > 1 ? 's' : ''}
                </span>
                <span className="text-orange-600 ml-1">
                  — Des modifications ont été apportées depuis la génération ({
                    [...new Set(staleSections.filter(s => s.isStale).flatMap(s => s.changes.map(c => c.label)))].join(', ')
                  })
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                onClick={() => {
                  // Scroll vers la première section obsolète
                  const firstStale = staleSections.find(s => s.isStale)
                  if (firstStale) {
                    setSelectedSectionId(firstStale.sectionId)
                  }
                }}
              >
                Voir les sections
              </Button>
            </div>
          )}

          {/* Content: 2 colonnes */}
          <div className="flex relative" style={{ minHeight: 'calc(100vh - 250px)' }}>
            {/* Colonne gauche: Liste des questions (scrollable) */}
            <div className="w-[45%] flex-shrink-0">
              {showRecreateButton ? (
                <Card className="m-4 flex-1 flex flex-col items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Aucune section trouvée</p>
                    <Button onClick={handleRecreateSections} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        'Créer les sections à partir du template'
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <SectionsList
                  sections={sections}
                  items={items}
                  selectedSectionId={selectedSectionId}
                  onSelectSection={setSelectedSectionId}
                  onOpenComments={(sectionId) => {
                    setSectionIdForComments(sectionId)
                    setCommentsModalOpen(true)
                  }}
                  sectionsCommentsCount={sectionsCommentsCount}
                  onGenerateAll={handleGenerateAllClick}
                  isGeneratingAll={isGeneratingAll}
                  generatingIndex={generatingIndex}
                  isFrozen={memoire.isFrozen || false}
                  isPaused={isPaused}
                  onPause={handlePauseGeneration}
                  onResume={handleResumeGeneration}
                  onStop={handleStopGeneration}
                  generationPhase={generationPhase}
                  currentItemTitle={currentItemTitle}
                  staleSections={staleSections}
                />
              )}
            </div>

            {/* Colonne droite: Éditeur de réponse (sticky) */}
            <div className="flex-1 min-w-0">
              <div className="sticky top-[20px]">
                <SectionEditor
                  section={selectedSection || null}
                  content={sectionContent}
                  isFrozen={memoire.isFrozen || false}
                  onContentChange={(content) => {
                    setSectionContent(content)
                    setSaved(false)

                    // Règle : Si le contenu change et que le statut est REVIEWED ou VALIDATED, revenir à DRAFT
                    const currentSection = sections.find((s) => s.id === selectedSectionId)
                    if (currentSection) {
                      const isReviewedOrValidated = currentSection.status === 'REVIEWED' || currentSection.status === 'VALIDATED' || currentSection.status === 'COMPLETED'
                      const contentHasChanged = content !== lastSavedContent

                      if (contentHasChanged && isReviewedOrValidated) {
                        // Mettre à jour le statut dans l'état local immédiatement (sans sauvegarde)
                        setSections((prev) =>
                          prev.map((s) =>
                            s.id === selectedSectionId ? { ...s, status: 'DRAFT' } : s
                          )
                        )
                      }
                    }
                  }}
                  saving={saving}
                  saved={saved}
                  onUpdateStatus={handleUpdateStatus}
                  projectId={projectId}
                  memoireId={memoireId}
                  onOpenAI={() => setAiModalOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Assistant IA */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Assistant IA</DialogTitle>
            <DialogDescription>
              Générez, reformulez ou améliorez le contenu de cette section
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            {selectedSectionId && !memoire.isFrozen && (
              <AIPanel
                projectId={projectId}
                memoireId={memoireId}
                sectionId={selectedSectionId}
                sectionContent={sectionContent}
                onReplace={(text) => {
                  setSectionContent(text)
                  setSaved(false)
                  setAiModalOpen(false)
                }}
                onInsert={(text) => {
                  setSectionContent((prev) => prev + (prev ? '\n\n' : '') + text)
                  setSaved(false)
                  setAiModalOpen(false)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des commentaires */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Commentaires</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            {sectionIdForComments && (
              <SectionComments
                sectionId={sectionIdForComments}
                sectionStatus={sections.find((s) => s.id === sectionIdForComments)?.status}
                userRole={userRole || undefined}
                onValidationChange={() => {
                  // Recharger les sections pour mettre à jour le statut
                  fetchSections()
                }}
                onCommentsChange={() => {
                  // Recharger le nombre de commentaires
                  fetchSections()
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport d'export */}
      <ExportReportModal
        open={showExportReport}
        onOpenChange={setShowExportReport}
        report={exportReport}
        fileName={exportedFile?.fileName || ''}
        onDownload={handleDownloadExportedFile}
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le mémoire technique ?"
        description="Cette action supprimera définitivement le mémoire et toutes ses données. Cette action est irréversible."
        itemName={memoire?.title}
        onConfirm={handleDeleteMemo}
        deleting={deleting}
      />

      <ConfirmDialog
        open={showGenerateAllDialog}
        onOpenChange={setShowGenerateAllDialog}
        title="Générer toutes les réponses ?"
        description={
          <div className="space-y-2">
            <p>Générer les réponses IA pour <strong>{sections.length} questions</strong>.</p>
            <p className="text-muted-foreground">Les réponses seront générées une par une. Le traitement peut prendre plusieurs minutes.</p>
            <p className="text-muted-foreground">Vous pouvez modifier les réponses déjà générées pendant que les autres sont en cours de génération.</p>
          </div>
        }
        onConfirm={handleGenerateAll}
        confirmLabel="Générer"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      />

      {/* Modal de choix désynchronisation */}
      {syncStatus && !syncStatus.isSync && (
        <DesyncChoiceModal
          open={showDesyncModal}
          onOpenChange={(open) => {
            setShowDesyncModal(open)
            if (!open) {
              setDesyncDismissed(true)
            }
          }}
          syncStatus={syncStatus}
          currentVersion={memoire.versionNumber || 1}
          onContinue={() => {
            setDesyncDismissed(true)
          }}
          onCreateNewVersion={handleCreateNewVersion}
        />
      )}
    </div>
  )
}
