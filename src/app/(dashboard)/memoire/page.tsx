/**
 * Page globale de la bibliothèque de mémoires
 * Liste tous les mémoires avec filtres
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Loader2,
  Plus,
  Search,
  Calendar,
  FolderOpen,
  MoreVertical,
  Trash2,
  Eye,
} from 'lucide-react'
import { useMemos, UseMemosFilters } from '@/hooks/useMemos'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ProjectHeader } from '@/components/projects/ProjectHeader'

interface Project {
  id: string
  name: string
  description?: string
}

export default function MemoiresPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<UseMemosFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [deletingMemoId, setDeletingMemoId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memoToDelete, setMemoToDelete] = useState<{ id: string; title: string } | null>(null)

  const { memos, loading, error, refetch } = useMemos(filters)

  // Afficher les erreurs avec toast
  useEffect(() => {
    if (error) {
      toast.error('Erreur', {
        description: error,
      })
    }
  }, [error])

  // Charger les projets quand la modal s'ouvre
  useEffect(() => {
    if (createDialogOpen) {
      fetchProjects()
    }
  }, [createDialogOpen])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await fetch('/api/projects')
      const data = await response.json()

      if (data.success && data.data) {
        setProjects(data.data)
        // Pré-sélectionner le premier projet s'il n'y en a qu'un
        if (data.data.length === 1) {
          setSelectedProjectId(data.data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleCreateMemo = () => {
    if (!selectedProjectId) {
      toast.error('Veuillez sélectionner un projet')
      return
    }
    setCreateDialogOpen(false)
    router.push(`/projects/${selectedProjectId}/memoire/new`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters((prev) => ({ ...prev, search: query || undefined }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === 'all' ? undefined : (status as UseMemosFilters['status']),
    }))
  }

  const handleDeleteClick = (memo: { id: string; title: string }) => {
    setMemoToDelete(memo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memoToDelete) return

    try {
      setDeletingMemoId(memoToDelete.id)
      const response = await fetch(`/api/memos/${memoToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mémoire supprimé', { description: 'Le mémoire a été supprimé avec succès' })
        setMemoToDelete(null)
        // Rafraîchir la liste
        if (refetch) {
          await refetch()
        } else {
          // Fallback: recharger la page si refetch n'est pas disponible
          window.location.reload()
        }
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer le mémoire' })
      // Ne pas réinitialiser memoToDelete en cas d'erreur pour que le dialog reste ouvert
    } finally {
      setDeletingMemoId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      DRAFT: 'outline',
      IN_PROGRESS: 'secondary',
      READY: 'default',
      EXPORTED: 'default',
    }

    const colors: Record<string, string> = {
      DRAFT: 'text-muted-foreground',
      IN_PROGRESS: 'text-blue-700 bg-blue-50 border-blue-200',
      READY: 'text-green-700 bg-green-50 border-green-200',
      EXPORTED: 'text-purple-700 bg-purple-50 border-purple-200',
    }

    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      IN_PROGRESS: 'En cours',
      READY: 'Prêt',
      EXPORTED: 'Exporté',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className={`text-xs ${colors[status] || ''}`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-6">
        <div className="text-center py-12">
          <p className="text-destructive font-medium text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader
        title="Bibliothèque de mémoires"
        subtitle="Tous les mémoires techniques de l'ensemble de vos projets"
        primaryAction={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer un mémoire
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choisir un projet</DialogTitle>
              <DialogDescription>
                Sélectionnez le projet pour lequel vous souhaitez créer un mémoire
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Aucun projet disponible
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      router.push('/projects/new')
                    }}
                  >
                    Créer un projet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedProjectId === project.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                        {selectedProjectId === project.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateMemo}
                disabled={!selectedProjectId || projects.length === 0}
              >
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Filtres - masqués si aucun mémoire et pas de filtres actifs */}
      {(memos.length > 0 || filters.search || filters.status) && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select onValueChange={handleStatusFilter} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="READY">Prêt</SelectItem>
                  <SelectItem value="EXPORTED">Exporté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des mémoires */}
      {memos.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-8 px-4">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucun mémoire</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.status
                ? 'Aucun mémoire ne correspond à vos critères.'
                : 'Commencez par créer un nouveau mémoire.'}
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un mémoire
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Choisir un projet</DialogTitle>
                  <DialogDescription>
                    Sélectionnez le projet pour lequel vous souhaitez créer un mémoire technique
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-4">
                        Aucun projet disponible
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCreateDialogOpen(false)
                          router.push('/projects/new')
                        }}
                      >
                        Créer un projet
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProjectId(project.id)}
                          className={`w-full text-left p-3 rounded-md border transition-colors ${
                            selectedProjectId === project.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            {selectedProjectId === project.id && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateMemo}
                    disabled={!selectedProjectId || projects.length === 0}
                  >
                    Continuer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memos.map((memo) => (
                  <TableRow key={memo.id} className="hover:bg-accent/50 cursor-pointer">
                    <TableCell className="font-medium text-sm">
                      <Link href={`/projects/${memo.projectId}/memoire/${memo.id}`}>
                        {memo.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${memo.projectId}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FolderOpen className="h-4 w-4" />
                        {memo.project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(memo.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(memo.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={deletingMemoId === memo.id}
                          >
                            {deletingMemoId === memo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${memo.projectId}/memoire/${memo.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ouvrir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick({ id: memo.id, title: memo.title })}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingMemoId === memo.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer ce mémoire ?"
        description="Cette action est irréversible. Le mémoire technique sera définitivement supprimé."
        itemName={memoToDelete?.title}
        onConfirm={handleDeleteConfirm}
        deleting={deletingMemoId !== null}
      />
    </div>
  )
}
