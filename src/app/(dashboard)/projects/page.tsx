/**
 * Page de liste des projets - Design compact et professionnel
 * Style Linear/Notion/Figma - élégant, minimaliste, dense et efficace
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectEmptyState } from '@/components/projects/ProjectEmptyState'
import { Loader2, Plus, Sparkles, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
    memories: number
  }
  documents?: any[]
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/projects')
      const data = await response.json()

      if (data.success && data.data) {
        setProjects(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des projets')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const totalDocuments = projects.reduce((acc, p) => acc + (p._count?.documents || p.documents?.length || 0), 0)
  const totalMemories = projects.reduce((acc, p) => acc + (p._count?.memories || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#151959] mx-auto" />
          <p className="text-sm text-[#64748b]">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="space-y-3">
          <p className="text-[#DC2626] font-medium">{error}</p>
          <Button onClick={fetchProjects} variant="outline" size="sm" className="rounded-xl">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header compact */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#151959]">
              Mes Projets
            </h1>
            <Badge variant="secondary" className="rounded-full bg-[#f8f9fd] text-[#64748b] border-border/50 text-xs px-2 py-0.5">
              Version 1.0
            </Badge>
          </div>
          <p className="text-base text-[#64748b]">
            Gérez vos projets et générez vos mémoires techniques avec l'IA
          </p>
        </div>
        <Button
          onClick={() => router.push('/projects/new')}
          size="default"
          className="gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Créer un projet
        </Button>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <ProjectEmptyState />
      ) : (
        <>
          {/* Stats Overview - compact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748b] mb-1">Projets</p>
                  <p className="text-2xl font-semibold text-[#151959]">{projects.length}</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#64748b]" />
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748b] mb-1">Documents</p>
                  <p className="text-2xl font-semibold text-[#151959]">{totalDocuments}</p>
                </div>
                <FileText className="h-5 w-5 text-[#64748b]" />
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748b] mb-1">Mémoires</p>
                  <p className="text-2xl font-semibold text-[#151959]">{totalMemories}</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#64748b]" />
              </div>
            </div>
          </div>

          {/* Projects Grid - compact */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
