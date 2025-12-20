/**
 * Page de consultation des exigences d'un projet
 * Vue passive - les exigences sont extraites automatiquement depuis les documents AO
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import Link from 'next/link'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { RequirementDetailModal } from '@/components/requirements/RequirementDetailModal'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'

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

// Intervalle de polling en ms
const POLLING_INTERVAL = 7000

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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres avec valeurs par défaut
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null)
  
  // Ref pour le polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  // État pour la relance de l'analyse
  const [retrying, setRetrying] = useState(false)

  // Fonction pour relancer l'analyse des documents en erreur
  const handleRetryAnalysis = async () => {
    try {
      setRetrying(true)
      const response = await fetch('/api/requirements/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, includeErrors: true }),
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Analyse relancée pour ${data.data?.totalDocuments || 0} document(s)`)
        // Rafraîchir après un court délai pour laisser le temps à l'extraction
        setTimeout(() => fetchRequirements(false), 2000)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la relance')
      }
    } catch (err) {
      toast.error('Erreur lors de la relance de l\'analyse')
    } finally {
      setRetrying(false)
    }
  }

  const fetchRequirements = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('projectId', projectId)
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter)
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        params.set('priority', priorityFilter)
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
      setRefreshing(false)
    }
  }, [projectId, categoryFilter, statusFilter, priorityFilter])

  // Rafraîchissement manuel
  const handleRefresh = () => {
    setRefreshing(true)
    fetchRequirements(false)
  }

  // Initial fetch + polling
  useEffect(() => {
    fetchRequirements(true)
  }, [fetchRequirements])

  // Gestion du polling automatique
  useEffect(() => {
    // Nettoyer l'ancien polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    // Démarrer le polling si des documents sont en cours de traitement
    const isProcessing = documentStatus && (documentStatus.waiting > 0 || documentStatus.processing > 0)
    
    if (isProcessing) {
      pollingRef.current = setInterval(() => {
        fetchRequirements(false)
      }, POLLING_INTERVAL)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [documentStatus?.waiting, documentStatus?.processing, fetchRequirements])

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
      toast.error('Erreur', err instanceof Error ? err.message : "Impossible de supprimer l'exigence")
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

  // Récupérer les catégories et priorités uniques pour les filtres
  const categories = Array.from(new Set(requirements.map((r) => r.category).filter(Boolean)))
  const priorities = Array.from(new Set(requirements.map((r) => r.priority).filter(Boolean)))

  // Déterminer les états
  const isExtracting = documentStatus && (documentStatus.waiting > 0 || documentStatus.processing > 0)
  const hasErrors = documentStatus && documentStatus.error > 0
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
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Header avec gradient (même style que Exports) */}
      <ProjectHeader
        title="Exigences"
        subtitle="Vue consultative • Extraites automatiquement depuis les documents AO"
      />
      
      {/* Bouton retour vers Mémoire technique */}
      <div className="mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}/memoire`}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Retour au mémoire technique
        </HeaderLinkButton>
      </div>

      {/* ÉTAT 1 : Aucun document AO */}
      {hasNoDocsAO && (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune exigence</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Importez vos documents AO (AE, RC, CCAP, CCTP, DPGF) dans &quot;Documents&quot; pour activer l&apos;analyse automatique des exigences.
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
          {/* Bandeau d'analyse en cours */}
          {isExtracting && (
            <Card className="mb-4 border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700">
                      Analyse des documents en cours…
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Les exigences apparaîtront automatiquement. {documentStatus?.processing} en traitement, {documentStatus?.waiting} en attente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bandeau d'erreurs */}
          {hasErrors && !isExtracting && (
            <Card className="mb-4 border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-700">
                        {documentStatus?.error} document{(documentStatus?.error || 0) > 1 ? 's' : ''} n&apos;ont pas pu être analysés
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Vous pouvez réessayer l&apos;analyse ou consulter les documents.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-orange-700 border-orange-300 hover:bg-orange-100"
                      onClick={handleRetryAnalysis}
                      disabled={retrying}
                    >
                      {retrying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Réessayer l&apos;analyse
                    </Button>
                    <Link href={`/projects/${projectId}/documents`}>
                      <Button variant="ghost" size="sm" className="gap-2 text-orange-700 hover:bg-orange-100">
                        Voir les documents
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bandeau de résumé (quand tout est OK) */}
          {!isExtracting && !hasErrors && documentStatus && documentStatus.done > 0 && (
            <Card className="mb-4 border-green-200/50 bg-green-50/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{documentStatus.done}/{documentStatus.totalDocsAO}</span> document{documentStatus.done > 1 ? 's' : ''} analysé{documentStatus.done > 1 ? 's' : ''} · <span className="font-medium text-foreground">{requirements.length}</span> exigence{requirements.length > 1 ? 's' : ''} extraite{requirements.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-8 w-8 p-0"
                    title="Rafraîchir"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtres - toujours visibles si des docs AO existent */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
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
                    <SelectItem value="TODO" className="text-xs">À traiter</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="text-xs">En cours</SelectItem>
                    <SelectItem value="COVERED" className="text-xs">Couverte</SelectItem>
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

          {/* État vide sans filtres - analyse en cours ou pas encore de résultats */}
          {requirements.length === 0 && !hasFiltersActive && !isExtracting && (
            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center text-center py-8 px-4">
                <FileText className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold mb-2">Aucune exigence extraite</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Les documents AO ont été analysés mais aucune exigence n&apos;a été détectée.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tableau des exigences */}
          {requirements.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Code</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead className="w-[120px]">Catégorie</TableHead>
                      <TableHead className="w-[100px]">Priorité</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[150px]">Source</TableHead>
                      <TableHead className="w-[150px]">Liée à</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
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
                        <TableCell>
                          {req.sectionLinks && req.sectionLinks.length > 0 ? (
                            <div className="text-xs space-y-1">
                              {req.sectionLinks.slice(0, 2).map((link) => (
                                <div key={link.id} className="text-muted-foreground truncate max-w-[130px]" title={`§${link.section.order}. ${link.section.title}`}>
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
    </div>
  )
}
