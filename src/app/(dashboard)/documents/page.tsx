/**
 * Page de vue globale des documents
 * Affiche tous les documents de l'utilisateur avec filtres, recherche et actions
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
import { PageHeader } from '@/components/ui/page-header'
import {
  FileText,
  Search,
  Filter,
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
        setError(data.error?.message || 'Erreur lors du chargement des documents')
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
        toast.info('Téléchargement', `Téléchargement de ${fileName}...`)
        // window.open(`/api/documents/${documentId}/download`, '_blank')
      } else {
        throw new Error(data.error?.message || 'Document non trouvé')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de télécharger le document')
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      setDeletingId(documentId)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Document supprimé', 'Le document a été supprimé avec succès')
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer le document')
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
          <Badge variant="accent" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Traité
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            En cours
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#151959] mx-auto" />
          <p className="text-sm text-[#64748b]">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
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
    <div className="max-w-6xl mx-auto space-y-4 py-6">
      {/* Header compact */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Documents
        </h1>
      </div>

      {/* Filtres et recherche compactes */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Tous les projets</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Tous les types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center text-center py-12 px-6">
            <div className="mb-4">
              <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {documents.length === 0 ? 'Aucun document' : 'Aucun document trouvé'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {documents.length === 0
                ? 'Créez un projet et importez vos premiers documents pour commencer.'
                : 'Ajustez vos filtres pour trouver vos documents.'}
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
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'upload</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType)

                  return (
                    <TableRow
                      key={doc.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => router.push(`/projects/${doc.project.id}/documents/${doc.id}`)}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/projects/${doc.project.id}`)
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          {doc.project.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        {doc.documentType ? (
                          <Badge variant="secondary" className="text-xs">{doc.documentType}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={deletingId === doc.id}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/projects/${doc.project.id}/documents/${doc.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ouvrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.fileName)}>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc.id)}
                              className="text-destructive focus:text-destructive"
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
    </div>
  )
}
