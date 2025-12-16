/**
 * Page d'édition d'un mémoire technique
 * Layout 2 colonnes : sections + éditeur
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
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'
import { AIPanel } from '@/components/memoire/AIPanel'
import { SectionsList } from '@/components/memoire/SectionsList'
import { SectionEditor } from '@/components/memoire/SectionEditor'
import { CompanyProfileWarning } from '@/components/memoire/CompanyProfileWarning'
import { MemoireVersionControl } from '@/components/memoire/MemoireVersionControl'
import { SectionComments } from '@/components/memoire/SectionComments'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Memoire {
  id: string
  title: string
  status: string
  versionNumber?: number
  isFrozen?: boolean
  parentMemoireId?: string | null
  project: {
    id: string
    name: string
  }
}

interface MemoireSection {
  id: string
  title: string
  order: number
  question?: string
  status: string
  content?: string
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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'CONTRIBUTOR' | 'REVIEWER' | null>(null)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [sectionIdForComments, setSectionIdForComments] = useState<string | null>(null)
  const [sectionsCommentsCount, setSectionsCommentsCount] = useState<Record<string, number>>({})

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

  // Charger le contenu de la section sélectionnée
  useEffect(() => {
    if (selectedSectionId) {
      const section = sections.find((s) => s.id === selectedSectionId)
      if (section) {
        setSectionContent(section.content || '')
        setSaved(false)
      }
    }
  }, [selectedSectionId, sections])

  // Autosave sur debounce
  useEffect(() => {
    if (selectedSectionId && debouncedContent !== undefined) {
      saveSectionContent()
    }
  }, [debouncedContent, selectedSectionId])

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

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memos/${memoireId}/sections`)
      const data = await response.json()

      if (data.success && data.data) {
        const sortedSections = [...data.data].sort((a, b) => a.order - b.order)
        setSections(sortedSections)

        // Sélectionner la première section par défaut
        if (sortedSections.length > 0 && !selectedSectionId) {
          setSelectedSectionId(sortedSections[0].id)
        }

        // Charger le nombre de commentaires pour chaque section
        const commentsCounts: Record<string, number> = {}
        await Promise.all(
          sortedSections.map(async (section: any) => {
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
        toast.success('Sections recréées', 'Les sections ont été recréées à partir du template')
        await fetchSections()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la recréation')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de recréer les sections')
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
              ? { ...s, content: sectionContent, status: newStatus || s.status }
              : s
          )
        )
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

  const handleMarkAsReviewed = async () => {
    if (!selectedSectionId) return

    try {
      const response = await fetch(
        `/api/memos/${memoireId}/sections/${selectedSectionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSectionId ? { ...s, status: 'COMPLETED' } : s
          )
        )
        toast.success('Section marquée comme relue')
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      console.error('Error marking as reviewed:', err)
    }
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background" style={{ minHeight: 'var(--app-header-height)' }}>
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Link href={`/projects/${projectId}/memoire`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold">{memoire.title}</h1>
                  {memoire && (
                    <MemoireVersionControl
                      memoireId={memoire.id}
                      versionNumber={memoire.versionNumber || 1}
                      isFrozen={memoire.isFrozen || false}
                      parentMemoireId={memoire.parentMemoireId}
                      onNewVersionCreated={(newId) => {
                        // La redirection est gérée dans le composant
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {memoire.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {memoire.project.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Export à venir"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning profil entreprise */}
      <div className="px-4 pt-4">
        <CompanyProfileWarning />
      </div>

      {/* Content: 2 colonnes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Colonne gauche: Liste des questions */}
        {showRecreateButton ? (
          <div className="w-[450px] border-r bg-muted/30 flex flex-col items-center justify-center p-8">
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
          </div>
        ) : (
          <SectionsList
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onOpenComments={(sectionId) => {
              setSectionIdForComments(sectionId)
              setCommentsModalOpen(true)
            }}
            sectionsCommentsCount={sectionsCommentsCount}
          />
        )}

        {/* Colonne droite: Éditeur de réponse */}
        <SectionEditor
          section={selectedSection || null}
          content={sectionContent}
          onContentChange={(content) => {
            setSectionContent(content)
            setSaved(false)
          }}
          saving={saving}
          saved={saved}
          onMarkAsReviewed={handleMarkAsReviewed}
        />
      </div>

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
    </div>
  )
}
