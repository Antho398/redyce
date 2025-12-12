/**
 * Page de détail d'un projet
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Sparkles, FolderOpen, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setProject(data.data)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Projet non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/projects/${params.id}/documents`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              {project._count?.documents || project.documents?.length || 0} document
              {(project._count?.documents || project.documents?.length || 0) > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gérer les documents
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/projects/${params.id}/dpgf`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              DPGF
            </CardTitle>
            <CardDescription>Extraire et structurer les DPGF</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gérer les DPGF
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/projects/${params.id}/cctp`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              CCTP
            </CardTitle>
            <CardDescription>Générer des CCTP</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Générer un CCTP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

