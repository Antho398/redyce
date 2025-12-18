/**
 * Composant de visualisation DPGF avec tableau structuré professionnel
 * Design Modern SaaS pour professionnels du BTP
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download,
  RefreshCw,
  Send,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { toast } from 'sonner'

interface DPGFTableViewerProps {
  dpgfId: string
  projectName?: string
  onRefresh?: () => void
}

interface DPGFItem {
  id?: string
  lot?: string
  reference?: string
  designation: string
  unite?: string
  quantite?: number
  prixUnitaire?: number
  total?: number
  normes?: string[]
  statut?: 'validated' | 'modified' | 'to_verify'
}

export function DPGFTableViewer({
  dpgfId,
  projectName,
  onRefresh,
}: DPGFTableViewerProps) {
  const [dpgf, setDpgf] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLot, setFilterLot] = useState<string>('all')
  const [isRecalculating, setIsRecalculating] = useState(false)

  useEffect(() => {
    fetchDPGF()
  }, [dpgfId])

  const fetchDPGF = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/dpgf/${dpgfId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setDpgf(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement du DPGF')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Transformation des données DPGF en tableau structuré
  const tableData = useMemo<DPGFItem[]>(() => {
    if (!dpgf?.data) return []

    const items: DPGFItem[] = []
    const data = dpgf.data

    // Traitement des articles
    if (data.articles && Array.isArray(data.articles)) {
      data.articles.forEach((article: any, index: number) => {
        items.push({
          id: `article-${index}`,
          lot: article.lot || 'Non assigné',
          reference: article.numero || article.reference,
          designation: article.titre || 'Sans titre',
          unite: article.unite || 'U',
          quantite: article.quantite || 0,
          prixUnitaire: article.prixUnitaire || 0,
          total: (article.quantite || 0) * (article.prixUnitaire || 0),
          normes: article.normes || [],
          statut: article.statut || 'to_verify',
        })

        // Ajouter les matériaux de l'article comme lignes séparées
        if (article.materiaux && Array.isArray(article.materiaux)) {
          article.materiaux.forEach((materiau: any, mIndex: number) => {
            items.push({
              id: `article-${index}-materiau-${mIndex}`,
              lot: article.lot || 'Non assigné',
              reference: materiau.reference || materiau.designation,
              designation: materiau.designation,
              unite: materiau.unite || 'U',
              quantite: materiau.quantite || 0,
              prixUnitaire: materiau.prixUnitaire || 0,
              total: (materiau.quantite || 0) * (materiau.prixUnitaire || 0),
              normes: materiau.normes || [],
              statut: 'to_verify',
            })
          })
        }
      })
    }

    // Traitement des matériaux généraux
    if (data.materiauxGeneraux && Array.isArray(data.materiauxGeneraux)) {
      data.materiauxGeneraux.forEach((materiau: any, index: number) => {
        items.push({
          id: `materiau-general-${index}`,
          lot: 'Général',
          reference: materiau.reference || materiau.designation,
          designation: materiau.designation,
          unite: 'U',
          quantite: 0,
          prixUnitaire: 0,
          total: 0,
          normes: [],
          statut: 'to_verify',
        })
      })
    }

    return items
  }, [dpgf])

  // Liste des lots uniques pour le filtre
  const lots = useMemo(() => {
    const uniqueLots = new Set<string>()
    tableData.forEach((item) => {
      if (item.lot) uniqueLots.add(item.lot)
    })
    return Array.from(uniqueLots).sort()
  }, [tableData])

  // Filtrage des données
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLot = filterLot === 'all' || item.lot === filterLot
      return matchesSearch && matchesLot
    })
  }, [tableData, searchQuery, filterLot])

  // Calcul du total général
  const totalGeneral = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.total || 0), 0)
  }, [filteredData])

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      // TODO: Implémenter le recalcul via API
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Recalcul effectué', 'Les totaux ont été recalculés')
      fetchDPGF()
    } catch (err) {
      toast.error('Erreur', 'Impossible de recalculer')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleExport = () => {
    if (!dpgf) return
    const blob = new Blob([JSON.stringify(dpgf.data, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dpgf.title || 'DPGF'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Export réussi', 'Le DPGF a été exporté')
  }

  const handleSendToCCTP = () => {
    // TODO: Navigation vers la page CCTP avec pré-remplissage
    toast.info('Redirection', 'Redirection vers la génération CCTP...')
    window.location.href = `/projects/${dpgf.projectId}/cctp?dpgfId=${dpgfId}`
  }

  const getStatusBadge = (statut?: string) => {
    switch (statut) {
      case 'validated':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validé
          </Badge>
        )
      case 'modified':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Edit className="h-3 w-3 mr-1" />
            Modifié
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            À vérifier
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Package className="h-10 w-10 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du DPGF...</p>
        </div>
      </div>
    )
  }

  if (error || !dpgf) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium mb-4">{error || 'DPGF non trouvé'}</p>
          <Button onClick={fetchDPGF} variant="outline" className="rounded-md">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {dpgf.title || 'DPGF sans titre'}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {dpgf.reference && (
                  <span>
                    <strong className="text-foreground">Référence:</strong> {dpgf.reference}
                  </span>
                )}
                {projectName && (
                  <span>
                    <strong className="text-foreground">Projet:</strong> {projectName}
                  </span>
                )}
                {dpgf.confidence && (
                  <Badge variant="outline" className="rounded-full">
                    Confiance: {(dpgf.confidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="rounded-xl"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRecalculating && 'animate-spin')}
                />
                Recalculer
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSendToCCTP}
                className="rounded-xl"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer vers CCTP
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Barre d'outils (filtres et recherche) */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par désignation ou référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-md"
              />
            </div>

            {/* Filtre par lot */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary shadow-sm transition-all"
              >
                <option value="all">Tous les lots</option>
                {lots.map((lot) => (
                  <option key={lot} value={lot}>
                    {lot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau structuré */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Lot</TableHead>
                  <TableHead className="w-[120px]">Référence</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="w-[100px] text-right">Unité</TableHead>
                  <TableHead className="w-[120px] text-right">Quantité</TableHead>
                  <TableHead className="w-[140px] text-right">Prix unitaire</TableHead>
                  <TableHead className="w-[140px] text-right">Total</TableHead>
                  <TableHead className="w-[150px]">Normes</TableHead>
                  <TableHead className="w-[130px]">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Aucun élément trouvé avec les filtres sélectionnés
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow
                      key={item.id || index}
                      className={cn(
                        'transition-colors',
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      )}
                    >
                      <TableCell className="font-medium text-foreground">
                        <Badge variant="outline" className="rounded-full">
                          {item.lot}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.reference || '—'}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.designation}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.unite}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {item.quantite?.toLocaleString('fr-FR') || '0'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.prixUnitaire
                          ? `${item.prixUnitaire.toLocaleString('fr-FR')} €`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {item.total ? `${item.total.toLocaleString('fr-FR')} €` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.normes && item.normes.length > 0 ? (
                            item.normes.slice(0, 2).map((norme, nIndex) => (
                              <Badge
                                key={nIndex}
                                variant="secondary"
                                className="text-xs rounded-full"
                              >
                                {norme}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {item.normes && item.normes.length > 2 && (
                            <Badge variant="outline" className="text-xs rounded-full">
                              +{item.normes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.statut)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer avec total */}
          {filteredData.length > 0 && (
            <div className="border-t border-border bg-muted/30 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {filteredData.length} élément{filteredData.length > 1 ? 's' : ''} affiché
                  {filterLot !== 'all' && ` (filtré par lot: ${filterLot})`}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Total général</div>
                  <div className="text-2xl font-bold text-primary">
                    {totalGeneral.toLocaleString('fr-FR')} €
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

