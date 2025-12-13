/**
 * Page de détail d'un projet
 * UI Premium Redyce - Sections en cartes, timeline, icônes cohérentes
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Sparkles,
  FolderOpen,
  Loader2,
  ArrowLeft,
  Package,
  Calendar,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

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

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setProject(data.data)
      } else {
        setError(data.error?.message || 'Projet non trouvé')
      }
    } catch (error) {
      setError('Une erreur est survenue')
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getProjectType = (name: string, description?: string): string => {
    const text = `${name} ${description || ''}`.toLowerCase()
    if (text.includes('rénovation') || text.includes('renovation')) return 'Rénovation'
    if (text.includes('construction')) return 'Construction'
    if (text.includes('aménagement') || text.includes('amenagement')) return 'Aménagement'
    return 'Projet'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-6 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-24">
        <div className="space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-destructive font-medium">{error || 'Projet non trouvé'}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push('/projects')} variant="outline" className="rounded-xl">
              Retour aux projets
            </Button>
            <Button onClick={fetchProject} variant="default" className="rounded-xl">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const documentCount = project._count?.documents || project.documents?.length || 0
  const memoryCount = project._count?.memories || 0
  const projectType = getProjectType(project.name, project.description)

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/projects')}
        className="rounded-xl"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      {/* En-tête projet style SaaS pro */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-[#151959]">{project.name}</h1>
                <Badge variant="secondary" className="rounded-full bg-[#f8f9fd] text-[#151959] border-border/50">
                  {projectType}
                </Badge>
                <Badge variant="outline" className="rounded-full border-green-200 bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              </div>
              {project.description && (
                <p className="text-base text-[#64748b] mb-4 font-medium">{project.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-[#64748b]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Créé le {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Mis à jour le {formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b] mb-1.5 font-medium">Documents</p>
                <p className="text-3xl font-bold text-[#151959]">{documentCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
                <FileText className="h-6 w-6 text-[#151959]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b] mb-1.5 font-medium">Mémoires générés</p>
                <p className="text-3xl font-bold text-[#151959]">{memoryCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
                <Sparkles className="h-6 w-6 text-[#151959]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections en cartes (Documents, DPGF, CCTP) */}
      <div>
        <h2 className="text-xl font-semibold text-[#151959] mb-4">Actions rapides</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-border/50 hover:border-[#151959]/30 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white"
            onClick={() => router.push(`/projects/${params.id}/documents`)}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
                  <FolderOpen className="h-5 w-5 text-[#151959]" />
                </div>
                <CardTitle className="text-lg text-[#151959]">Documents</CardTitle>
              </div>
              <CardDescription className="text-[#64748b]">
                Gérer et importer vos documents techniques (PDF, DOCX, images)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full rounded-xl">
                <FolderOpen className="h-4 w-4 mr-2" />
                Voir les documents
              </Button>
            </CardContent>
          </Card>

          <Card
            className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-border/50 hover:border-[#151959]/30 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white"
            onClick={() => router.push(`/projects/${params.id}/dpgf`)}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
                  <Package className="h-5 w-5 text-[#151959]" />
                </div>
                <CardTitle className="text-lg text-[#151959]">DPGF</CardTitle>
              </div>
              <CardDescription className="text-[#64748b]">
                Extraire et structurer les DPGF depuis vos documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full rounded-xl">
                <Package className="h-4 w-4 mr-2" />
                Extraire un DPGF
              </Button>
            </CardContent>
          </Card>

          <Card
            className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-border/50 hover:border-[#151959]/30 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white"
            onClick={() => router.push(`/projects/${params.id}/cctp`)}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
                  <FileCheck className="h-5 w-5 text-[#151959]" />
                </div>
                <CardTitle className="text-lg text-[#151959]">CCTP</CardTitle>
              </div>
              <CardDescription className="text-[#64748b]">
                Générer des CCTP automatiquement avec l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full rounded-xl">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer un CCTP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
