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
  Sparkles,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import Link from 'next/link'

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
}

export default function ProjectRequirementsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequirements()
  }, [projectId, categoryFilter, statusFilter])

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
      const data: ApiResponse<Requirement[]> = await response.json()

      if (data.success && data.data) {
        setRequirements(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des exigences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractRequirements = async () => {
    try {
      setExtracting(true)
      setError(null)

      const response = await fetch('/api/requirements/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data: ApiResponse<{ requirements: Requirement[]; count: number }> =
        await response.json()

      if (data.success && data.data) {
        toast.success(
          'Exigences extraites',
          `${data.data.count} exigence(s) extraite(s) avec succès`
        )
        fetchRequirements() // Recharger la liste
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'extraction')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'extraction'
      setError(errorMessage)
      toast.error('Erreur', errorMessage)
    } finally {
      setExtracting(false)
    }
  }

  const handleDelete = async (requirementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette exigence ?')) {
      return
    }

    try {
      setDeletingId(requirementId)
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Exigence supprimée', 'L\'exigence a été supprimée avec succès')
        setRequirements((prev) => prev.filter((req) => req.id !== requirementId))
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
      case 'VALIDATED':
        return (
          <Badge variant="default" className="gap-1 text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Validée
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <XCircle className="h-3 w-3" />
            Rejetée
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            En attente
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            Haute
          </Badge>
        )
      case 'normal':
        return (
          <Badge variant="secondary" className="text-xs">
            Normale
          </Badge>
        )
      case 'low':
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Récupérer les catégories uniques pour le filtre
  const categories = Array.from(new Set(requirements.map((r) => r.category).filter(Boolean)))

  return (
    <div className="max-w-6xl mx-auto py-6 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Exigences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exigences extraites depuis les documents AO (AE, RC, CCAP, CCTP, DPGF)
          </p>
        </div>
        <Button size="sm" onClick={handleExtractRequirements} disabled={extracting}>
          {extracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extraction...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Extraire les exigences
            </>
          )}
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ''}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="VALIDATED">Validée</SelectItem>
                <SelectItem value="REJECTED">Rejetée</SelectItem>
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
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 px-6">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucune exigence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucune exigence ne correspond à vos critères.'
                : 'Commencez par extraire les exigences depuis vos documents AO.'}
            </p>
            <Button size="sm" onClick={handleExtractRequirements} disabled={extracting}>
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extraire les exigences
                </>
              )}
            </Button>
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
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((req) => (
                  <TableRow key={req.id} className="hover:bg-accent/50">
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
                            onClick={() => router.push(`/projects/${projectId}/exigences/${req.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(req.id)}
                            className="text-destructive focus:text-destructive"
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
    </div>
  )
}

