/**
 * Page de liste des projets
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, FolderOpen } from 'lucide-react'
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
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchProjects}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos projets et générez vos mémoires techniques
          </p>
        </div>
        <Button onClick={() => router.push('/projects/new')}>
          Nouveau Projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-muted-foreground mb-4 text-lg">
            Vous n&apos;avez pas encore de projet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Créez votre premier projet pour commencer à uploader des documents et générer des mémoires techniques
          </p>
          <Button onClick={() => router.push('/projects/new')} size="lg">
            Créer votre premier projet
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const documentCount = project._count?.documents || project.documents?.length || 0
            const memoryCount = project._count?.memories || 0

            return (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents:
                      </span>
                      <span className="font-medium">{documentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mémoires:</span>
                      <span className="font-medium">{memoryCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Créé le:</span>
                      <span className="font-medium">{formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/projects/${project.id}`)
                      }}
                    >
                      Voir
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/projects/${project.id}/documents`)
                      }}
                    >
                      Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

