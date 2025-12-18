/**
 * Page de détail d'un projet - Design System Redyce V1
 * Style compact, professionnel, dense
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Sparkles,
  FolderOpen,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  FileEdit,
  Pencil,
  Trash2,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react'
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

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implémenter l'édition du projet
    toast.info('Édition du projet (à implémenter)')
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Projet supprimé avec succès')
        router.push('/projects')
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive font-medium text-sm">{error || 'Projet non trouvé'}</p>
          <Button onClick={() => router.push('/projects')} variant="outline" size="sm">
            Retour aux projets
          </Button>
        </div>
      </div>
    )
  }

  const documentCount = project._count?.documents || project.documents?.length || 0
  const memoryCount = project._count?.memoires || 0
  const projectType = getProjectType(project.name, project.description)

  return (
    <div className="max-w-6xl mx-auto space-y-3 py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title={project.name}
        subtitle={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {projectType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(project.updatedAt)}
            </span>
          </div>
        }
        primaryAction={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Bouton retour - sous le header */}
      <div className="mb-2">
        <HeaderLinkButton
          href="/projects"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Retour aux projets
        </HeaderLinkButton>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer ce projet ?"
        description="Cette action est irréversible. Tous les documents et mémoires associés seront également supprimés."
        itemName={project?.name}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Stats compactes en table */}
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documents</TableHead>
                <TableHead>Mémoires générés</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{documentCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{memoryCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions rapides en table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/projects/${params.id}/documents`)}
              >
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    Documents
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Gérer et importer vos documents sources (AO, DPGF, CCTP)
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/projects/${params.id}/memoire`)}
              >
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                    Mémoire technique
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Rédiger et générer le mémoire technique du projet
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
