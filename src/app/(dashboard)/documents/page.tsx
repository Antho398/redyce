/**
 * Page de vue globale des fichiers et sources
 * Affiche tous les fichiers et documents de l'utilisateur avec filtres, recherche et actions
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import {
  FileText,
  Search,
  MoreVertical,
  Download,
  Trash2,
  File,
  Image as ImageIcon,
  FolderOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string | null
  status: string
  createdAt: string
  project: {
    id: string
    name: string
  }
  _count?: {
    analyses: number
  }
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/documents')
      const data = await response.json()

      if (data.success && data.data) {
        setDocuments(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des fichiers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Filtres et recherche
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesProject = selectedProject === 'all' || doc.project.id === selectedProject
      const matchesType = selectedType === 'all' || doc.documentType === selectedType

      return matchesSearch && matchesProject && matchesType
    })
  }, [documents, searchQuery, selectedProject, selectedType])

  // Liste des projets uniques pour le filtre
  const projects = useMemo(() => {
    const uniqueProjects = new Map<string, { id: string; name: string }>()
    documents.forEach((doc) => {
      if (!uniqueProjects.has(doc.project.id)) {
        uniqueProjects.set(doc.project.id, doc.project)
      }
    })
    return Array.from(uniqueProjects.values())
  }, [documents])

  // Liste des types uniques pour le filtre
  const documentTypes = useMemo(() => {
    const types = new Set<string>()
    documents.forEach((doc) => {
      if (doc.documentType) {
        types.add(doc.documentType)
      }
    })
    return Array.from(types)
  }, [documents])

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()

      if (data.success && data.data) {
        // Pour l'instant, on redirige vers le document
        // TODO: Implémenter le téléchargement direct du fichier
        toast.info('Téléchargement', { description: `Téléchargement de ${fileName}...` })
        // window.open(`/api/documents/${documentId}/download`, '_blank')
      } else {
        throw new Error(data.error?.message || 'Fichier non trouvé')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de télécharger le fichier' })
    }
  }

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      setDeletingId(documentToDelete.id)
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Fichier supprimé', { description: 'Le fichier a été supprimé avec succès' })
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id))
        setShowDeleteDialog(false)
        setDocumentToDelete(null)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer le fichier' })
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType === 'application/pdf') return FileText
    return File
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="accent" className="gap-1 text-xs px-1.5 py-0">
            <CheckCircle2 className="h-3 w-3" />
            Traité
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0">
            <Loader2 className="h-3 w-3 animate-spin" />
            En cours
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs px-1.5 py-0">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des fichiers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
        <div className="text-center py-12">
        <div className="space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-[#DC2626]" />
          <p className="text-[#DC2626] font-medium text-sm">{error}</p>
          <Button onClick={fetchDocuments} variant="outline" size="sm" className="rounded-xl">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader
        title="Fichiers & sources"
        subtitle="Tous les documents importés sur l'ensemble de vos projets"
      />

      {/* Filtres et recherche compacts - masqués si aucun fichier */}
      {documents.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fichier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="flex h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              aria-label="Filtrer par projet"
              title="Filtrer par projet"
            >
              <option value="all">Tous les projets</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              aria-label="Filtrer par type"
              title="Filtrer par type"
            >
              <option value="all">Tous les types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                {type}
              </option>
            ))}
            </select>
          </div>
        </div>
      )}

      {/* Tableau des fichiers */}
      {filteredDocuments.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-12 px-6">
            <FolderOpen className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">
              {documents.length === 0 ? 'Aucun fichier' : 'Aucun fichier trouvé'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {documents.length === 0
                ? 'Créez un projet et importez vos premiers fichiers pour commencer.'
                : 'Ajustez vos filtres pour trouver vos fichiers.'}
            </p>
            {documents.length === 0 && (
              <Button 
                onClick={() => router.push('/projects/new')} 
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer un projet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium py-2">Fichier</TableHead>
                  <TableHead className="text-xs font-medium py-2">Projet</TableHead>
                  <TableHead className="text-xs font-medium py-2">Type</TableHead>
                  <TableHead className="text-xs font-medium py-2">Statut</TableHead>
                  <TableHead className="text-xs font-medium py-2">Taille</TableHead>
                  <TableHead className="text-xs font-medium py-2">Date</TableHead>
                  <TableHead className="w-[40px] py-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType)

                  return (
                    <TableRow
                      key={doc.id}
                      className="hover:bg-accent/50 cursor-pointer h-10"
                      onClick={() => router.push(`/projects/${doc.project.id}/documents/${doc.id}`)}
                    >
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-medium truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/projects/${doc.project.id}`)
                          }}
                          className="text-xs text-primary hover:underline truncate max-w-[150px] block"
                          title={doc.project.name}
                        >
                          {doc.project.name}
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        {doc.documentType ? (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">{doc.documentType}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="transform scale-90 origin-left">
                          {getStatusBadge(doc.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={deletingId === doc.id}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <MoreVertical className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => router.push(`/projects/${doc.project.id}/documents/${doc.id}`)}
                              className="text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Ouvrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.fileName)} className="text-xs">
                              <Download className="h-3.5 w-3.5 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(doc)}
                              className="text-xs text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
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
          if (!open) setDocumentToDelete(null)
        }}
        title="Supprimer ce fichier ?"
        description="Cette action est irréversible. Le fichier sera définitivement supprimé."
        itemName={documentToDelete?.fileName || documentToDelete?.name}
        onConfirm={handleDelete}
        deleting={!!deletingId && deletingId === documentToDelete?.id}
      />
    </div>
  )
}
