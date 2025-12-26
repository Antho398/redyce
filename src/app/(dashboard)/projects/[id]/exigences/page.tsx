/**
 * Page de consultation des exigences d'un projet
 * Vue passive - les exigences sont extraites automatiquement depuis les documents AO
 */

'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  X,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import Link from 'next/link'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { RequirementDetailModal } from '@/components/requirements/RequirementDetailModal'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/helpers'

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

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}


function ProjectRequirementsContent({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [documentStatus, setDocumentStatus] = useState<DocumentStatusSummary | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres avec valeurs par défaut
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25)
  
  // Initialiser depuis l'URL au premier chargement
  useEffect(() => {
    if (searchParams) {
      const urlCategory = searchParams.get('category')
      const urlStatus = searchParams.get('status')
      const urlPriority = searchParams.get('priority')
      const urlPage = searchParams.get('page')
      const urlLimit = searchParams.get('limit')
      
      if (urlCategory) setCategoryFilter(urlCategory)
      if (urlStatus) setStatusFilter(urlStatus)
      if (urlPriority) setPriorityFilter(urlPriority)
      if (urlPage) setCurrentPage(Number(urlPage))
      if (urlLimit) {
        setItemsPerPage(urlLimit === 'all' || urlLimit === '1000' ? 'all' : Number(urlLimit))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Une seule fois au montage
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null)
  
  // Sélection multiple pour actions bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showTrashFilter, setShowTrashFilter] = useState(false)
  
  // Modals de confirmation pour actions bulk
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkPermanentDeleteDialog, setShowBulkPermanentDeleteDialog] = useState(false)

  // État pour gérer le hover uniforme sur toute la ligne
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // États pour création manuelle d'exigence
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MED' as 'HIGH' | 'MED' | 'LOW',
  })
  


  const fetchRequirements = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('projectId', projectId)
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter)
      }
      // Si on est en mode corbeille, envoyer SUPPRIMEE explicitement
      // Sinon, ne pas envoyer de status (l'API exclura SUPPRIMEE par défaut)
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        params.set('priority', priorityFilter)
      }
      
      // Paramètres de pagination
      params.set('page', String(currentPage))
      if (itemsPerPage === 'all') {
        params.set('limit', '1000') // Limite max pour "Tout"
      } else {
        params.set('limit', String(itemsPerPage))
      }

      // Mettre à jour l'URL sans recharger la page
      const newUrl = `/projects/${projectId}/exigences?${params.toString()}`
      router.replace(newUrl, { scroll: false })

      const response = await fetch(`/api/requirements?${params.toString()}`)
      const data: ApiResponse<{ 
        requirements: Requirement[]
        documentStatus: DocumentStatusSummary
        pagination: PaginationInfo
      }> = await response.json()

      if (data.success && data.data) {
        setRequirements(data.data.requirements || [])
        setDocumentStatus(data.data.documentStatus || null)
        setPagination(data.data.pagination || null)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des exigences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [projectId, categoryFilter, statusFilter, priorityFilter, currentPage, itemsPerPage, router])

  // Initial fetch
  useEffect(() => {
    fetchRequirements(true)
  }, [fetchRequirements])

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
        toast.success('Exigence supprimée', { description: "L'exigence a été supprimée avec succès" })
        setRequirements((prev) => prev.filter((req) => req.id !== requirementToDelete.id))
        setShowDeleteDialog(false)
        setRequirementToDelete(null)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : "Impossible de supprimer l'exigence" })
    } finally {
      setDeletingId(null)
    }
  }

  // Création manuelle d'une exigence
  const handleCreateRequirement = async () => {
    if (!newRequirement.title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newRequirement.title.trim(),
          description: newRequirement.description.trim() || undefined,
          category: newRequirement.category.trim() || undefined,
          priority: newRequirement.priority,
          status: 'A_TRAITER',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Exigence créée', { description: "L'exigence a été ajoutée avec succès" })
        setShowCreateDialog(false)
        setNewRequirement({ title: '', description: '', category: '', priority: 'MED' })
        // Rafraîchir la liste
        fetchRequirements(false)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : "Impossible de créer l'exigence" })
    } finally {
      setCreating(false)
    }
  }

  // Sélection multiple
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    const pageIds = new Set(requirements.map((r) => r.id))
    const allPageSelected = requirements.every((r) => selectedIds.has(r.id))
    
    if (allPageSelected) {
      // Désélectionner tous les items de la page courante
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        pageIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      // Sélectionner tous les items de la page courante
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        pageIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  // Actions bulk
  const handleBulkStatus = async (status: 'A_TRAITER' | 'COVERED' | 'SUPPRIMEE') => {
    if (selectedIds.size === 0) return

    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/requirements/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      })

      const data = await response.json()

      if (data.success) {
        const count = data.data.updatedCount || data.data.updated || selectedIds.size
        const statusLabels = {
          A_TRAITER: 'à traiter',
          COVERED: 'couverte',
          SUPPRIMEE: 'supprimée',
        }
        toast.success(`${count} exigence${count > 1 ? 's' : ''} marquée${count > 1 ? 's' : ''} comme ${statusLabels[status]}`)
        setSelectedIds(new Set())
        fetchRequirements(false)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async (permanent: boolean = false) => {
    if (selectedIds.size === 0) return

    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/requirements/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), permanent }),
      })

      const data = await response.json()

      if (data.success) {
        const count = data.data.deletedCount || data.data.deleted || selectedIds.size
        if (permanent) {
          toast.success(`${count} exigence${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''} définitivement`)
          setRequirements((prev) => prev.filter((req) => !selectedIds.has(req.id)))
        } else {
          toast.success(`${count} exigence${count > 1 ? 's' : ''} déplacée${count > 1 ? 's' : ''} dans la corbeille`)
        }
        setSelectedIds(new Set())
        fetchRequirements(false)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return

    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/requirements/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      const data = await response.json()

      if (data.success) {
        const count = data.data.restoredCount || data.data.restored || selectedIds.size
        toast.success(`${count} exigence${count > 1 ? 's' : ''} restaurée${count > 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        fetchRequirements(false)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la restauration')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la restauration')
    } finally {
      setBulkActionLoading(false)
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
      case 'SUPPRIMEE':
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-gray-100 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3" />
            Supprimée
          </Badge>
        )
      default: // A_TRAITER
        return (
          <Badge variant="outline" className="gap-1 text-xs whitespace-nowrap">
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

  // Récupérer les catégories et priorités uniques pour les filtres
  // Note: On utilise toutes les exigences pour les filtres, pas seulement la page courante
  // Pour optimiser, on pourrait faire une requête séparée pour les catégories/priorités
  const categories = Array.from(new Set(requirements.map((r) => r.category).filter(Boolean)))
  const priorities = Array.from(new Set(requirements.map((r) => r.priority).filter(Boolean)))
  
  // Utiliser les données de pagination du serveur
  const totalItems = pagination?.total || 0
  const totalPages = pagination?.totalPages || 1
  const startIndex = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
  const endIndex = pagination ? Math.min(startIndex + pagination.limit - 1, pagination.total) : 0
  
  // Calculer les statuts des exigences sélectionnées pour déterminer quelles actions sont disponibles
  const selectedRequirementsStatuses = requirements
    .filter((req) => selectedIds.has(req.id))
    .map((req) => req.status)
  
  const hasOnlyCovered = selectedRequirementsStatuses.length > 0 && 
    selectedRequirementsStatuses.every((status) => status === 'COVERED')
  const hasOnlySupprimee = selectedRequirementsStatuses.length > 0 && 
    selectedRequirementsStatuses.every((status) => status === 'SUPPRIMEE')
  const hasMixedStatuses = selectedRequirementsStatuses.length > 0 && 
    new Set(selectedRequirementsStatuses).size > 1
  
  // Réinitialiser la sélection si on change de page
  useEffect(() => {
    setSelectedIds(new Set())
  }, [currentPage, itemsPerPage])
  
  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [categoryFilter, statusFilter, priorityFilter, showTrashFilter])

  const hasNoDocsAO = documentStatus && documentStatus.totalDocsAO === 0
  const hasFiltersActive = categoryFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-4 px-4">
        <ProjectHeader
          title="Exigences"
          subtitle="Vue consultative • Extraites automatiquement depuis les documents AO"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient (même style que Exports) */}
      <ProjectHeader
        title="Exigences"
        subtitle="Extraites automatiquement depuis les documents source"
        primaryAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
            title="Ajouter une exigence"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        }
      />
      
      {/* Bouton retour vers Mémoire technique */}
      <div className="mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}/memoire`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour au mémoire technique
        </HeaderLinkButton>
      </div>

      {/* ÉTAT 1 : Aucun document AO */}
      {hasNoDocsAO && (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25" data-tutorial="exigences-list">
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune exigence</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Importez vos documents AO (AE, RC, CCAP, CCTP, DPGF) dans "Documents" pour activer l'analyse automatique des exigences.
            </p>
            <Link href={`/projects/${projectId}/documents`}>
              <Button size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Aller à Documents
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ÉTAT 2+ : Des documents AO existent */}
      {!hasNoDocsAO && (
        <>
          {/* Bandeau de résumé */}
          {documentStatus && documentStatus.totalDocsAO > 0 && (
            <Card className="mb-4 border-green-200/50 bg-green-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{documentStatus.done}/{documentStatus.totalDocsAO}</span> document{documentStatus.done > 1 ? 's' : ''} analysé{documentStatus.done > 1 ? 's' : ''} · <span className="font-medium text-foreground">{pagination?.total || 0}</span> exigence{(pagination?.total || 0) > 1 ? 's' : ''} extraite{(pagination?.total || 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtres - toujours visibles si des docs AO existent */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle Corbeille */}
                <Button
                  variant={showTrashFilter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newShowTrash = !showTrashFilter
                    setShowTrashFilter(newShowTrash)
                    setStatusFilter(newShowTrash ? 'SUPPRIMEE' : 'all')
                    setSelectedIds(new Set()) // Réinitialiser la sélection
                  }}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {showTrashFilter ? 'Voir les exigences actives' : 'Voir la corbeille'}
                </Button>
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                  disabled={requirements.length === 0}
                >
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

                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                  disabled={requirements.length === 0}
                >
                  <SelectTrigger className="w-[180px] h-8 px-3 text-xs">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tous les statuts</SelectItem>
                    <SelectItem value="A_TRAITER" className="text-xs">À traiter</SelectItem>
                    <SelectItem value="COVERED" className="text-xs">Couverte</SelectItem>
                    <SelectItem value="SUPPRIMEE" className="text-xs">Supprimée</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={priorityFilter} 
                  onValueChange={setPriorityFilter}
                  disabled={requirements.length === 0}
                >
                  <SelectTrigger className="w-[180px] h-8 px-3 text-xs">
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Toutes les priorités</SelectItem>
                    <SelectItem value="HIGH" className="text-xs">Haute</SelectItem>
                    <SelectItem value="MED" className="text-xs">Moyenne</SelectItem>
                    <SelectItem value="LOW" className="text-xs">Basse</SelectItem>
                  </SelectContent>
                </Select>

                {hasFiltersActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('all')
                      setStatusFilter('all')
                      setPriorityFilter('all')
                    }}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Erreur de chargement */}
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

          {/* État vide avec filtres actifs */}
          {requirements.length === 0 && hasFiltersActive && (
            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center text-center py-8 px-4">
                <FileText className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold mb-2">Aucun résultat</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aucune exigence ne correspond à vos critères de filtrage.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          )}

          {/* État vide sans filtres */}
          {requirements.length === 0 && !hasFiltersActive && (
            <Card className="bg-muted/30" data-tutorial="exigences-list">
              <CardContent className="flex flex-col items-center text-center py-8 px-4">
                <FileText className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold mb-2">Aucune exigence extraite</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Les documents AO ont été analysés mais aucune exigence n'a été détectée.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Barre d'actions bulk sticky avec animation */}
          {selectedIds.size > 0 && (
            <Card className={cn(
              "mb-4 sticky top-0 z-10 bg-background border-primary/20 shadow-md",
              "animate-in fade-in-0 slide-in-from-top-2 duration-200"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {selectedIds.size} exigence{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!showTrashFilter ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBulkStatus('COVERED')}
                          disabled={bulkActionLoading}
                          className="h-8 text-xs"
                        >
                          {bulkActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marquer comme couverte
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBulkStatus('A_TRAITER')}
                          disabled={bulkActionLoading}
                          className="h-8 text-xs"
                        >
                          {bulkActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Marquer comme à traiter
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBulkDeleteDialog(true)}
                          disabled={bulkActionLoading}
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBulkRestore()}
                          disabled={bulkActionLoading}
                          className="h-8 text-xs"
                        >
                          {bulkActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurer
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowBulkPermanentDeleteDialog(true)}
                          disabled={bulkActionLoading}
                          className="h-8 text-xs"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer définitivement
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIds(new Set())}
                      disabled={bulkActionLoading}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tout désélectionner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tableau des exigences */}
          {requirements.length > 0 && (
            <Card data-tutorial="exigences-list">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-blue-50 bg-blue-50">
                      <TableHead className="w-[50px] sticky left-0 z-20 border-r bg-blue-50">
                        <Checkbox
                          checked={selectedIds.size === requirements.length && requirements.length > 0}
                          onCheckedChange={toggleSelectAll}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableHead>
                      <TableHead className="w-[80px] sticky left-[50px] z-20 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(255,255,255,0.1)] bg-blue-50">Code</TableHead>
                      <TableHead className="sticky left-[130px] z-20 bg-blue-50 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(255,255,255,0.1)]">Titre</TableHead>
                      <TableHead className="w-[120px] bg-blue-50">Catégorie</TableHead>
                      <TableHead className="w-[100px] bg-blue-50">Priorité</TableHead>
                      <TableHead className="w-[100px] bg-blue-50">Statut</TableHead>
                      <TableHead className="w-[150px] bg-blue-50">Source</TableHead>
                      <TableHead className="w-[100px] bg-blue-50">Date</TableHead>
                      <TableHead className="w-[50px] bg-blue-50"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements.map((req) => {
                      const isHovered = hoveredRowId === req.id
                      const hoverBg = isHovered ? 'bg-accent/50' : ''
                      
                      return (
                      <TableRow
                        key={req.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRowId(req.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        onClick={(e) => {
                          if (!(e.target as HTMLElement)?.closest('input[type="checkbox"]') && !(e.target as HTMLElement)?.closest('button')) {
                            setSelectedRequirement(req)
                          }
                        }}
                      >
                        <TableCell 
                          className={`sticky left-0 z-10 border-r ${isHovered ? 'bg-accent/50' : 'bg-card'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(req.id)}
                            onCheckedChange={() => toggleSelect(req.id)}
                          />
                        </TableCell>
                        <TableCell 
                          className={`font-mono text-xs text-muted-foreground sticky left-[50px] z-10 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(255,255,255,0.1)] ${isHovered ? 'bg-accent/50' : 'bg-card'}`}
                        >
                          {req.code || '—'}
                        </TableCell>
                        <TableCell 
                          className={`font-medium text-sm max-w-md sticky left-[130px] z-10 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(255,255,255,0.1)] ${isHovered ? 'bg-accent/50' : 'bg-card'}`}
                        >
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
                        <TableCell className={isHovered ? 'bg-accent/50' : ''}>
                          {req.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {req.category}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className={isHovered ? 'bg-accent/50' : ''}>{getPriorityBadge(req.priority)}</TableCell>
                        <TableCell className={isHovered ? 'bg-accent/50' : ''}>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className={isHovered ? 'bg-accent/50' : ''}>
                          {req.document ? (
                            <div className="text-xs">
                              <Link
                                href={`/projects/${projectId}/documents/${req.document.id}`}
                                className="text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-3 w-3" />
                                <span className="truncate max-w-[100px]" title={req.document.name}>
                                  {req.document.name}
                                </span>
                              </Link>
                              {req.sourcePage && (
                                <p className="text-muted-foreground mt-1">Page {req.sourcePage}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm text-muted-foreground ${isHovered ? 'bg-accent/50' : ''}`}>
                          {formatDate(req.createdAt)}
                        </TableCell>
                        <TableCell className={isHovered ? 'bg-accent/50' : ''} onClick={(e) => e.stopPropagation()}>
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
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              
              {/* Pagination */}
              {totalItems > 0 && (
                <div className="border-t p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Lignes par page :</span>
                    <Select
                      value={itemsPerPage === 'all' ? 'all' : String(itemsPerPage)}
                      onValueChange={(value) => {
                        const newValue = value === 'all' ? 'all' : Number(value)
                        setItemsPerPage(newValue)
                        setCurrentPage(1)
                        if (newValue === 'all' && totalItems > 1000) {
                          toast.warning('Limite de 1000 items pour "Tout"')
                        }
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="all" disabled={totalItems > 1000}>
                          Tout {totalItems > 1000 && '(max 1000)'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ml-4">
                      {totalItems === 0 ? '0' : `${startIndex}–${endIndex}`} sur {totalItems}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination?.hasPreviousPage || itemsPerPage === 'all'}
                      className="h-8"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={!pagination?.hasNextPage || itemsPerPage === 'all'}
                      className="h-8"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
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

      {/* Modal de confirmation de suppression bulk (corbeille) */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Supprimer les exigences sélectionnées ?</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedIds.size} exigence{selectedIds.size > 1 ? 's' : ''} sera{selectedIds.size > 1 ? 'ont' : ''} déplacée{selectedIds.size > 1 ? 's' : ''} dans la corbeille et pourra{selectedIds.size > 1 ? 'ont' : ''} être restaurée{selectedIds.size > 1 ? 's' : ''}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} disabled={bulkActionLoading}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowBulkDeleteDialog(false)
                handleBulkDelete(false)
              }} 
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression définitive bulk */}
      <Dialog open={showBulkPermanentDeleteDialog} onOpenChange={setShowBulkPermanentDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Supprimer définitivement les exigences sélectionnées ?</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedIds.size} exigence{selectedIds.size > 1 ? 's' : ''} sera{selectedIds.size > 1 ? 'ont' : ''} supprimée{selectedIds.size > 1 ? 's' : ''} définitivement. Cette action est irréversible.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkPermanentDeleteDialog(false)} disabled={bulkActionLoading}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowBulkPermanentDeleteDialog(false)
                handleBulkDelete(true)
              }} 
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création d'exigence */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une exigence</DialogTitle>
            <DialogDescription>
              Créez une nouvelle exigence manuellement pour ce projet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Délai de livraison respecté"
                value={newRequirement.title}
                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Détails de l'exigence..."
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                rows={3}
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  placeholder="Ex: Technique, Qualité..."
                  value={newRequirement.category}
                  onChange={(e) => setNewRequirement({ ...newRequirement, category: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value: 'HIGH' | 'MED' | 'LOW') =>
                    setNewRequirement({ ...newRequirement, priority: value })
                  }
                  disabled={creating}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Basse</SelectItem>
                    <SelectItem value="MED">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setNewRequirement({ title: '', description: '', category: '', priority: 'MED' })
              }}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateRequirement}
              disabled={creating || !newRequirement.title.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'exigence"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProjectRequirementsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProjectRequirementsContent params={params} />
    </Suspense>
  )
}
