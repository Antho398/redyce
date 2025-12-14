/**
 * Section Résultat - Affiche les livrables générés
 * Composant réutilisable pour tous les types de livrables
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  RefreshCw,
  CheckCircle2,
  FileText,
  Clock,
  History,
} from 'lucide-react'
import { LivrableData, LivrableType } from '@/types/livrables'
import { DPGFTableViewer } from '@/components/dpgf/DPGFTableViewer'
import { CCTPSplitViewer } from '@/components/cctp/CCTPSplitViewer'

interface LivrableResultSectionProps {
  livrableType: LivrableType
  livrables: LivrableData[]
  selectedLivrableId?: string | null
  projectName?: string
  onSelectLivrable?: (id: string) => void
  onRefresh?: () => void
  onDownload?: (id: string) => void
  onExport?: (id: string) => void
  onValidate?: (id: string) => void
  onFinalize?: (id: string) => void
}

export function LivrableResultSection({
  livrableType,
  livrables,
  selectedLivrableId,
  projectName,
  onSelectLivrable,
  onRefresh,
  onDownload,
  onExport,
  onValidate,
  onFinalize,
}: LivrableResultSectionProps) {
  const selectedLivrable = selectedLivrableId
    ? livrables.find((l) => l.id === selectedLivrableId)
    : livrables[0]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      extracted: { label: 'Extrait', variant: 'secondary' },
      validated: { label: 'Validé', variant: 'default' },
      archived: { label: 'Archivé', variant: 'outline' },
      draft: { label: 'Brouillon', variant: 'secondary' },
      generated: { label: 'Généré', variant: 'default' },
      finalized: { label: 'Finalisé', variant: 'default' },
    }

    const config = statusConfig[status] || { label: status, variant: 'secondary' }
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  if (livrables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Résultat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun {livrableType} généré pour le moment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Résultat</CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            )}
            {selectedLivrable && onDownload && (
              <Button variant="outline" size="sm" onClick={() => onDownload(selectedLivrable.id)} className="gap-2">
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Historique des versions (si plusieurs) */}
        {livrables.length > 1 && (
          <div className="border-b pb-3">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Historique ({livrables.length} version{livrables.length > 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {livrables.map((livrable) => (
                <Button
                  key={livrable.id}
                  variant={selectedLivrableId === livrable.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSelectLivrable?.(livrable.id)}
                  className="text-xs"
                >
                  {livrable.title}
                  {livrable.version && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      v{livrable.version}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Informations du livrable sélectionné */}
        {selectedLivrable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{selectedLivrable.title}</h3>
                  {getStatusBadge(selectedLivrable.status)}
                </div>
                {selectedLivrable.reference && (
                  <p className="text-xs text-muted-foreground">
                    Référence: {selectedLivrable.reference}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(selectedLivrable.createdAt)}
                  </span>
                  {selectedLivrable.updatedAt !== selectedLivrable.createdAt && (
                    <span>Modifié: {formatDate(selectedLivrable.updatedAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions spécifiques au type */}
            {(onValidate || onFinalize || onExport) && (
              <div className="flex items-center gap-2">
                {livrableType === LivrableType.DPGF && onValidate && selectedLivrable.status !== 'validated' && (
                  <Button
                    size="sm"
                    onClick={() => onValidate(selectedLivrable.id)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Valider
                  </Button>
                )}
                {livrableType === LivrableType.CCTP && onFinalize && selectedLivrable.status !== 'finalized' && (
                  <Button
                    size="sm"
                    onClick={() => onFinalize(selectedLivrable.id)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finaliser
                  </Button>
                )}
                {onExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport(selectedLivrable.id)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                )}
              </div>
            )}

            {/* Visualisation du contenu selon le type */}
            <div className="border-t pt-4">
              {livrableType === LivrableType.DPGF && selectedLivrableId && (
                <DPGFTableViewer
                  dpgfId={selectedLivrableId}
                  projectName={projectName}
                  onRefresh={onRefresh}
                />
              )}
              {livrableType === LivrableType.CCTP && selectedLivrableId && (
                <CCTPSplitViewer
                  cctpId={selectedLivrableId}
                  projectName={projectName}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

