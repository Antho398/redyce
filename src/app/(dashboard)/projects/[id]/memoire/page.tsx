/**
 * Page de gestion des mémoires techniques d'un projet
 * Liste les mémoires du projet + CTA création
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
  FileText,
  Loader2,
  Plus,
  Calendar,
  AlertCircle,
  FileX,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import { useMemos } from '@/hooks/useMemos'
import { toast } from 'sonner'
import Link from 'next/link'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'

export default function ProjectMemosPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [documents, setDocuments] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memoToDelete, setMemoToDelete] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { memos, loading, error, refetch } = useMemos({ projectId })

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`)
      const data = await response.json()

      if (data.success && data.data) {
        // Filtrer les documents de type MODELE_MEMOIRE ou tous les documents si aucun n'est marqué
        const templates = data.data.filter(
          (doc: any) => !doc.documentType || doc.documentType === 'MODELE_MEMOIRE'
        )
        setDocuments(templates)
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
    }
  }

  // Charger les documents du projet pour sélectionner le template
  useEffect(() => {
    fetchDocuments()
  }, [projectId])


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
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDeleteClick = (memo: any) => {
    setMemoToDelete({ id: memo.id, title: memo.title })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memoToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/memos/${memoToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mémoire supprimé', 'Le mémoire technique a été supprimé avec succès')
        await refetch()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer le mémoire')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setMemoToDelete(null)
    }
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

  const templatesAvailable = documents.length > 0

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Mémoires techniques"
        subtitle="Mémoires techniques de ce projet"
        primaryAction={
          <Link href={`/projects/${projectId}/memoire/new`}>
            <Button size="sm" disabled={!templatesAvailable}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau mémoire
            </Button>
          </Link>
        }
      />

      {/* Bouton retour - sous le header avec espacement uniforme */}
      <div className="flex items-center justify-between mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}/questions`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
        >
          Retour aux questions extraites
        </HeaderLinkButton>
      </div>

      {/* Empty state si aucun template */}
      {!templatesAvailable && (
        <Card className="border-l-4 border-yellow-500 bg-yellow-50/50 bg-gradient-to-r from-yellow-50/50 via-yellow-50/30 to-[#F8D347]/25 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">Template mémoire requis</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Veuillez uploader un document de type MODELE_MEMOIRE pour créer un mémoire.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/documents`)}
              >
                Aller aux documents
              </Button>
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
              Créez votre premier mémoire technique pour ce projet.
            </p>
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/memoire/new`)}
              disabled={!templatesAvailable}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau mémoire
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memos.map((memo) => (
                  <TableRow key={memo.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium text-sm">
                      {memo.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {memo.template.name || memo.template.fileName}
                    </TableCell>
                    <TableCell>{getStatusBadge(memo.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(memo.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/projects/${projectId}/memoire/${memo.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(memo)}
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
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer ce mémoire technique ?"
        description="Cette action est irréversible. Le mémoire technique sera définitivement supprimé."
        itemName={memoToDelete?.title}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </div>
  )
}
