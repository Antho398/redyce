/**
 * Page de gestion des documents d'un projet - Design System Redyce V1
 * Style compact, professionnel, dense
 */

'use client'

import { useState, useEffect } from 'react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  File,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string
  status: string
  createdAt: string
}

export default function ProjectDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [template, setTemplate] = useState<any>(null)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchTemplate()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/projects/${projectId}/documents`)
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

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()
      if (data.success) {
        setTemplate(data.data)
      }
    } catch (err) {
      // Template n'existe pas encore, c'est normal
      setTemplate(null)
    }
  }

  const handleUploadComplete = () => {
    fetchDocuments()
    fetchTemplate()
  }

  const handleCreateTemplate = async (documentId: string) => {
    try {
      const response = await fetch('/api/memoire/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, documentId }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTemplate() // Recharger le template pour avoir les bonnes données
        toast.success('Template créé', 'Le template mémoire a été créé. Vous pouvez maintenant le parser.')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création du template')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de créer le template')
    }
  }

  const handleParseTemplate = async () => {
    if (!template) return

    try {
      setParsing(true)
      const response = await fetch('/api/memoire/template/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTemplate() // Recharger le template
        toast.success('Template parsé', `Les sections ont été extraites avec succès (${(data.data.metaJson as any)?.nbSections || 0} sections).`)
        // Rediriger vers la page mémoire
        setTimeout(() => {
          router.push(`/projects/${projectId}/memoire`)
        }, 1500)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du parsing')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de parser le template')
    } finally {
      setParsing(false)
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType === 'application/pdf') return FileText
    return File
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="accent" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Traité
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            En cours
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        )
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-6">
      {/* Header compact */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérer et importer vos documents sources (AO, DPGF, CCTP)
        </p>
      </div>

      {/* Bloc template mémoire obligatoire */}
      {!template && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Template mémoire requis
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Vous devez d'abord uploader un template mémoire (DOCX ou PDF) pour pouvoir générer votre mémoire technique.
                </p>
                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Commencez par uploader votre template mémoire ci-dessous.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {documents
                      .filter((doc) => doc.mimeType.includes('pdf') || doc.mimeType.includes('word'))
                      .map((doc) => (
                        <Button
                          key={doc.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateTemplate(doc.id)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Utiliser "{doc.name}" comme template
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template parsé ou en cours */}
      {template && (
        <Card className={template.status === 'parsed' ? 'border-green-200 bg-green-50/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {template.status === 'PARSED' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : template.status === 'PARSING' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : template.status === 'FAILED' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Template mémoire : {template.status === 'PARSED' ? 'Parsé' : template.status === 'PARSING' ? 'Parsing...' : template.status === 'FAILED' ? 'Échec' : 'En attente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.status === 'PARSED'
                      ? `Le template a été analysé (${(template.metaJson as any)?.nbSections || 0} sections). Vous pouvez maintenant générer votre mémoire.`
                      : template.status === 'PARSING'
                      ? 'Analyse du template en cours...'
                      : template.status === 'FAILED'
                      ? 'L\'analyse du template a échoué. Réessayez ou contactez le support.'
                      : 'Analysez le template pour extraire les sections.'}
                  </p>
                </div>
              </div>
              {template.status === 'UPLOADED' && (
                <Button
                  size="sm"
                  onClick={handleParseTemplate}
                  disabled={parsing}
                  className="gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Parser le template
                    </>
                  )}
                </Button>
              )}
              {template.status === 'PARSED' && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/memoire`)}
                  className="gap-2"
                >
                  Aller au mémoire
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone upload compacte */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Importer des documents</p>
              <p className="text-xs text-muted-foreground">
                Formats supportés : PDF, DOCX, JPEG, PNG, GIF • Taille max : 50 Mo
              </p>
            </div>
          </div>
          <DocumentUpload
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Liste en table */}
      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
            <p className="text-sm text-destructive font-medium mb-4">{error}</p>
            <Button onClick={fetchDocuments} variant="outline" size="sm">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <EmptyDocumentsState projectId={projectId} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType)
                  return (
                    <TableRow
                      key={doc.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => router.push(`/projects/${projectId}/documents/${doc.id}`)}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                          {doc.documentType === 'TEMPLATE_MEMOIRE' && (
                            <Badge variant="default" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                              Template mémoire
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.documentType ? (
                          <Badge variant="secondary" className="text-xs">
                            {doc.documentType}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
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
                              onClick={() => router.push(`/projects/${projectId}/documents/${doc.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Téléchargement', 'Fonctionnalité à venir')}>
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

function EmptyDocumentsState({ projectId }: { projectId: string }) {
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
            Aucun document
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Importez des documents techniques (PDF, DOCX, images) pour les analyser et extraire des données.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
