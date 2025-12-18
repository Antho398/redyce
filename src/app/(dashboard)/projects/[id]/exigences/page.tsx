/**
 * Page de gestion des exigences d'un projet
 * Liste les exigences extraites depuis les documents AO
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import Link from 'next/link'
import { RequirementDetailModal } from '@/components/requirements/RequirementDetailModal'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

interface Requirement {
  id: string
  code?: string
  title: string
  description: string
  category?: string
  priority?: string
  status: string
  sourcePage?: number
  sourceQuote?: string
  createdAt: string
  document?: {
    id: string
    name: string
    fileName: string
    documentType: string
  }
  sectionLinks?: Array<{
    id: string
    section: {
      id: string
      title: string
      order: number
    }
  }>
}

interface DocumentStatusSummary {
  totalDocsAO: number
  waiting: number
  processing: number
  done: number
  error: number
  notProcessed: number
  documents: Array<{
    id: string
    name: string
    type: string
    status: string
    processedAt?: string
    error?: string
  }>
}

export default function ProjectRequirementsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [documentStatus, setDocumentStatus] = useState<DocumentStatusSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null)

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('projectId', projectId)
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter)
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/requirements?${params.toString()}`)
      const data: ApiResponse<{ requirements: Requirement[]; documentStatus: DocumentStatusSummary }> = await response.json()

      if (data.success && data.data) {
        setRequirements(data.data.requirements || [])
        setDocumentStatus(data.data.documentStatus || null)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des exigences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Polling pour rafraîchir si des documents sont en cours de traitement
  useEffect(() => {
    fetchRequirements()
    
    // Si des documents sont en WAITING ou PROCESSING, rafraîchir toutes les 5 secondes
    const hasProcessing = documentStatus && (documentStatus.waiting > 0 || documentStatus.processing > 0)
    if (hasProcessing) {
      const interval = setInterval(fetchRequirements, 5000)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, categoryFilter, statusFilter, documentStatus?.waiting, documentStatus?.processing])

  const handleDeleteClick = (requirement: Requirement) => {
    setRequirementToDelete(requirement)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!requirementToDelete) return

    try {
      setDeletingId(requirementToDelete.id)
      const response = await fetch(`/api/requirements/${requirementToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Exigence supprimée', "L'exigence a été supprimée avec succès")
        setRequirements((prev) => prev.filter((req) => req.id !== requirementToDelete.id))
        setShowDeleteDialog(false)
        setRequirementToDelete(null)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer l\'exigence')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COVERED':
        return (
          <Badge variant="default" className="gap-1 text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Couverte
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            En cours
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            À traiter
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    switch (priority) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="text-xs">
            Haute
          </Badge>
        )
      case 'MED':
        return (
          <Badge variant="secondary" className="text-xs">
            Moyenne
          </Badge>
        )
      case 'LOW':
        return (
          <Badge variant="outline" className="text-xs">
            Basse
          </Badge>
        )
      default:
        return null
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Récupérer les catégories uniques pour le filtre
  const categories = Array.from(new Set(requirements.map((r) => r.category).filter(Boolean)))

  // Déterminer si l'extraction est en cours
  const isExtracting = documentStatus && (documentStatus.waiting > 0 || documentStatus.processing > 0)
  const hasErrors = documentStatus && documentStatus.error > 0

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Header avec gradient - toujours en premier */}
      <ProjectHeader
        title="Exigences"
        subtitle="Exigences extraites depuis les documents AO (AE, RC, CCAP, CCTP, DPGF)"
      />

      {/* Indicateur de statut d'extraction */}
      {documentStatus && documentStatus.totalDocsAO > 0 && (
        <Card className={`mb-4 ${isExtracting ? 'border-blue-200 bg-blue-50/50' : hasErrors ? 'border-orange-200 bg-orange-50/50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Analyse en cours... ({documentStatus.processing} document{documentStatus.processing > 1 ? 's' : ''} en traitement, {documentStatus.waiting} en attente)
                    </span>
                  </>
                ) : hasErrors ? (
                  <>
                    <XCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700">
                      {documentStatus.error} document{documentStatus.error > 1 ? 's' : ''} en erreur sur {documentStatus.totalDocsAO}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">
                      {documentStatus.done} document{documentStatus.done > 1 ? 's' : ''} AO analysé{documentStatus.done > 1 ? 's' : ''} · {requirements.length} exigence{requirements.length > 1 ? 's' : ''} extraite{requirements.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              {/* Badge récapitulatif */}
              <div className="flex items-center gap-2">
                {documentStatus.done > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {documentStatus.done} analysé{documentStatus.done > 1 ? 's' : ''}
                  </Badge>
                )}
                {documentStatus.notProcessed > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {documentStatus.notProcessed} non traité{documentStatus.notProcessed > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] h-8 px-3 text-xs">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ''} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-8 px-3 text-xs">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tous les statuts</SelectItem>
                <SelectItem value="PENDING" className="text-xs">En attente</SelectItem>
                <SelectItem value="VALIDATED" className="text-xs">Validée</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des exigences */}
      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {requirements.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-8 px-4">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucune exigence</h3>
            {categoryFilter !== 'all' || statusFilter !== 'all' ? (
              <p className="text-sm text-muted-foreground">
                Aucune exigence ne correspond à vos critères.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Aucune exigence disponible. Importez des documents AO pour activer l&apos;analyse.
                </p>
                <Link href={`/projects/${projectId}/documents`}>
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importer des documents AO
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Liée à</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((req) => (
                  <TableRow
                    key={req.id}
                    className="hover:bg-accent/50 cursor-pointer"
                    onClick={() => setSelectedRequirement(req)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {req.code || '—'}
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-md">
                      <div>
                        <p className="truncate">{req.title}</p>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {req.description.substring(0, 100)}
                            {req.description.length > 100 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.category ? (
                        <Badge variant="secondary" className="text-xs">
                          {req.category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.document ? (
                        <div className="text-xs">
                          <Link
                            href={`/projects/${projectId}/documents/${req.document.id}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            {req.document.name}
                          </Link>
                          {req.sourcePage && (
                            <p className="text-muted-foreground mt-1">Page {req.sourcePage}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.sectionLinks && req.sectionLinks.length > 0 ? (
                        <div className="text-xs space-y-1">
                          {req.sectionLinks.slice(0, 2).map((link: any) => (
                            <div key={link.id} className="text-muted-foreground">
                              §{link.section.order}. {link.section.title}
                            </div>
                          ))}
                          {req.sectionLinks.length > 2 && (
                            <div className="text-muted-foreground">+{req.sectionLinks.length - 2} autres</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {deletingId === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedRequirement(req)}
                            className="text-xs"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(req)}
                            className="text-xs text-destructive focus:text-destructive"
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

      {/* Modal de détail */}
      {selectedRequirement && (
        <RequirementDetailModal
          requirement={selectedRequirement}
          projectId={projectId}
          open={!!selectedRequirement}
          onOpenChange={(open) => !open && setSelectedRequirement(null)}
          onUpdate={fetchRequirements}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setRequirementToDelete(null)
        }}
        title="Supprimer cette exigence ?"
        description="Cette action est irréversible."
        itemName={requirementToDelete?.title}
        onConfirm={handleDelete}
        deleting={!!deletingId && deletingId === requirementToDelete?.id}
      />
    </div>
  )
}

