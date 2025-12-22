/**
 * Page de liste des projets d'un client
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import { Loader2, Plus, FileText, AlertCircle, Eye, Pencil, Trash2, MoreVertical, ArrowLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'

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

interface Client {
  id: string
  name: string
  companyName?: string
}

export default function ClientProjectsPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const { data: session, status } = useSession()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClientAndProjects()
    }
  }, [status, clientId])

  const fetchClientAndProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch client info
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      const clientData = await clientResponse.json()

      if (!clientData.success) {
        setError(clientData.error?.message || 'Client non trouvé')
        return
      }

      setClient(clientData.data)

      // Fetch all projects and filter by clientId
      const projectsResponse = await fetch('/api/projects')
      const projectsData = await projectsResponse.json()

      if (projectsData.success && projectsData.data) {
        const clientProjects = projectsData.data.filter(
          (p: any) => p.clientId === clientId
        )
        setProjects(clientProjects)
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

  const handleEdit = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toast.info('Édition du projet (à implémenter)')
  }

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Projet supprimé avec succès')
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
        setShowDeleteDialog(false)
        setProjectToDelete(null)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-4 px-4">
        <div className="text-center py-12">
          <div className="space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-destructive font-medium text-sm">{error}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 py-4 px-4">
      {/* Header */}
      <ProjectHeader
        title={`Projets - ${client?.name || ''}`}
        subtitle={client?.companyName ? `${client.companyName}` : 'Liste des projets pour ce client'}
        primaryAction={
          <Button
            onClick={() => router.push('/projects/new')}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        }
      />

      {/* Back button */}
      <div className="flex items-center gap-3">
        <HeaderLinkButton
          href="/dashboard"
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
        >
          Retour au tableau de bord
        </HeaderLinkButton>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <EmptyProjectsState clientId={clientId} />
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/projects/${project.id}`)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleEdit(project.id, e)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Éditer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(project, e)}
                              className="text-destructive focus:text-destructive"
                              disabled={deleting && projectToDelete?.id === project.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setProjectToDelete(null)
        }}
        title="Supprimer ce projet ?"
        description="Cette action est irréversible. Tous les documents et mémoires associés seront également supprimés."
        itemName={projectToDelete?.name}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}

function EmptyProjectsState({ clientId }: { clientId: string }) {
  const router = useRouter()

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
      <CardContent className="flex flex-col items-center text-center py-12 px-4">
        <div className="mb-4">
          <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucun projet pour ce client
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Créez votre premier projet pour ce client pour commencer à organiser vos documents.
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
  )
}
