/**
 * Page des exports et versions du mémoire technique
 * Design compact, professionnel - Redyce V1
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download,
  FileText,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  XCircle,
  Trash2,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ExportPreviewDialog } from '@/components/exports/ExportPreviewDialog'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'

interface MemoireExport {
  id: string
  type: string
  status: string
  fileName?: string
  createdAt: string
  metadata?: any
  memoire: {
    id: string
    title: string
  }
}

export default function ProjectExportsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exports, setExports] = useState<MemoireExport[]>([])
  const [memoireId, setMemoireId] = useState<string | null>(null)
  const [memoireTitle, setMemoireTitle] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exportToDelete, setExportToDelete] = useState<MemoireExport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewExport, setPreviewExport] = useState<MemoireExport | null>(null)

  useEffect(() => {
    fetchExports()
    fetchMemoireId()
  }, [projectId])

  const fetchMemoireId = async () => {
    try {
      const response = await fetch(`/api/memos?projectId=${projectId}`)
      const data: ApiResponse<any[]> = await response.json()
      if (data.success && data.data && data.data.length > 0) {
        setMemoireId(data.data[0].id) // Prendre le premier mémoire du projet
        setMemoireTitle(data.data[0].title || 'Mémoire technique')
      }
    } catch (err) {
      console.error('Error fetching memoire:', err)
    }
  }

  const fetchExports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exports?projectId=${projectId}`)
      const data: ApiResponse<MemoireExport[]> = await response.json()

      if (data.success && data.data) {
        setExports(data.data)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des exports')
      console.error('Error fetching exports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateExport = async (fileName: string) => {
    if (!memoireId) {
      toast.error('Aucun mémoire trouvé pour ce projet')
      return
    }

    try {
      setGenerating(true)
      const response = await fetch(`/api/memos/${memoireId}/export-docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      })
      const data: ApiResponse<MemoireExport> = await response.json()

      if (data.success && data.data) {
        toast.success('Export généré avec succès', {
          description: data.data.metadata?.emptySectionsCount > 0
            ? `${data.data.metadata.emptySectionsCount} section(s) non complétée(s)`
            : undefined,
        })
        fetchExports() // Recharger la liste
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération')
      console.error('Error generating export:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (exportId: string, fileName?: string) => {
    const link = document.createElement('a')
    link.href = `/api/exports/${exportId}/download`
    link.download = fileName || 'memoire.docx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteClick = (exportItem: MemoireExport) => {
    setExportToDelete(exportItem)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!exportToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/exports/${exportToDelete.id}`, {
        method: 'DELETE',
      })
      const data: ApiResponse = await response.json()

      if (data.success) {
        toast.success('Export supprimé')
        fetchExports()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      console.error('Error deleting export:', err)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setExportToDelete(null)
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="gap-1 text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Disponible
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            En cours
          </Badge>
        )
      case 'ERROR':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <XCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Exports & versions"
        subtitle="Historique des exports DOCX du mémoire technique"
        primaryAction={
          <Button
            size="sm"
            onClick={() => setShowPreviewDialog(true)}
            disabled={generating || !memoireId}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer DOCX
              </>
            )}
          </Button>
        }
      />

      {/* Bouton retour - sous le header */}
      <div className="flex items-center justify-between">
        <HeaderLinkButton
          href={`/projects/${projectId}/memoire`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour au mémoire
        </HeaderLinkButton>
      </div>

      {/* Liste des exports */}
      {exports.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-8 px-4">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucun export</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {!memoireId
                ? 'Créez d\'abord un mémoire technique pour pouvoir générer un export.'
                : 'Les exports DOCX du mémoire technique apparaîtront ici une fois générés.'}
            </p>
            {!memoireId ? (
              <Button
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/memoire`)}
              >
                Aller au mémoire technique
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowPreviewDialog(true)}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser & Exporter
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exports disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportItem) => (
                  <TableRow key={exportItem.id}>
                    <TableCell className="font-medium text-sm max-w-[300px] truncate" title={exportItem.fileName}>
                      {exportItem.fileName?.replace('.docx', '') || exportItem.memoire?.title || 'Export'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {exportItem.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(exportItem.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(exportItem.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {exportItem.status === 'COMPLETED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setPreviewExport(exportItem)
                                setShowPreviewDialog(true)
                              }}
                              title="Prévisualiser le contenu"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(exportItem.id, exportItem.fileName)}
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(exportItem)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer cet export ?"
        description="Cette action supprimera définitivement le fichier exporté. Cette action est irréversible."
        itemName={exportToDelete?.fileName}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />

      {(memoireId || previewExport) && (
        <ExportPreviewDialog
          open={showPreviewDialog}
          onOpenChange={(open) => {
            setShowPreviewDialog(open)
            if (!open) setPreviewExport(null)
          }}
          memoireId={previewExport?.memoire?.id || memoireId!}
          memoireTitle={previewExport?.memoire?.title || memoireTitle}
          onExport={handleGenerateExport}
          exporting={generating}
          isViewOnly={!!previewExport}
        />
      )}
    </div>
  )
}

