/**
 * Page de liste des projets - Design System Redyce V1
 * Style compact, professionnel, dense - Référence pour toutes les autres pages
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, FileText, AlertCircle, Eye } from 'lucide-react'
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getProjectType = (name: string, description?: string): string => {
    const text = `${name} ${description || ''}`.toLowerCase()
    if (text.includes('rénovation') || text.includes('renovation')) return 'Rénovation'
    if (text.includes('construction')) return 'Construction'
    if (text.includes('aménagement') || text.includes('amenagement')) return 'Aménagement'
    return 'Général'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive font-medium text-sm">{error}</p>
          <Button onClick={fetchProjects} variant="outline" size="sm">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-6">
      {/* Header compact */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Projets
        </h1>
        <Button
          onClick={() => router.push('/projects/new')}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {/* Contenu */}
      {projects.length === 0 ? (
        <EmptyProjectsState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nom du projet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const documentCount = project._count?.documents || project.documents?.length || 0
                  const projectType = getProjectType(project.name, project.description)

                  return (
                    <TableRow
                      key={project.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell className="font-medium text-sm">
                        {project.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {projectType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{documentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/projects/${project.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * État vide compact - Design System V1
 */
function EmptyProjectsState() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center py-12 px-6">
          <div className="mb-4">
            <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun projet
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Créez votre premier projet pour organiser vos documents et générer vos mémoires.
          </p>
          <Button
            onClick={() => router.push('/projects/new')}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer un projet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
