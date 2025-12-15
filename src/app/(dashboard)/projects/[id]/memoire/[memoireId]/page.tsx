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

interface Memoire {
  id: string
  title: string
  status: string
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

  if (loading || !memoire) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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

      {/* Content: 3 colonnes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Colonne gauche: Liste des sections */}
        <SectionsList
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
        />

        {/* Colonne centre: Éditeur */}
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

        {/* Colonne droite: Commentaires */}
        {selectedSectionId && (
          <SectionComments
            sectionId={selectedSectionId}
            sectionStatus={selectedSection?.status}
            userRole={userRole || undefined}
            onValidationChange={() => {
              // Recharger les sections pour mettre à jour le statut
              fetchSections()
            }}
          />
        )}
      </div>
    </div>
  )
}
