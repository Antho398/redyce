/**
 * Composant pour le contrôle de version d'un mémoire
 * Affiche le badge de version et les boutons de versioning
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GitBranch,
  GitCompare,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { MemoireVersionComparison } from './MemoireVersionComparison'

interface MemoireVersionControlProps {
  memoireId: string
  versionNumber: number
  isFrozen: boolean
  parentMemoireId?: string | null
  onNewVersionCreated?: (newMemoireId: string) => void
}

export function MemoireVersionControl({
  memoireId,
  versionNumber,
  isFrozen,
  parentMemoireId,
  onNewVersionCreated,
}: MemoireVersionControlProps) {
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState<any>(null)

  const handleCreateNewVersion = async () => {
    try {
      setCreatingVersion(true)
      const response = await fetch(`/api/memos/${memoireId}/versions`, {
        method: 'POST',
      })
      const data: ApiResponse<any> = await response.json()

      if (data.success && data.data) {
        toast.success('Nouvelle version créée', `Version V${data.data.versionNumber} créée avec succès`)
        if (onNewVersionCreated) {
          onNewVersionCreated(data.data.id)
        }
        // Rediriger vers la nouvelle version
        window.location.href = window.location.pathname.replace(memoireId, data.data.id)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création de la version')
    } finally {
      setCreatingVersion(false)
    }
  }

  const handleCompareWithPrevious = async () => {
    if (!parentMemoireId) {
      toast.error('Aucune version précédente disponible')
      return
    }

    try {
      setComparing(true)
      const response = await fetch(`/api/memos/${memoireId}/compare?versionId=${parentMemoireId}`)
      const data: ApiResponse<any> = await response.json()

      if (data.success && data.data) {
        setComparisonData(data.data)
        setShowComparison(true)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la comparaison')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la comparaison')
    } finally {
      setComparing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium">
          V{versionNumber}
        </Badge>
        {isFrozen && (
          <Badge variant="secondary" className="text-xs">
            Figé
          </Badge>
        )}

        {!isFrozen && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateNewVersion}
              disabled={creatingVersion}
            >
              {creatingVersion ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <GitBranch className="h-3 w-3 mr-2" />
                  Nouvelle version
                </>
              )}
            </Button>

            {parentMemoireId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCompareWithPrevious}
                disabled={comparing}
              >
                {comparing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-3 w-3 mr-2" />
                    Comparer
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {showComparison && comparisonData && (
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Comparaison V{comparisonData.version1.versionNumber} vs V{comparisonData.version2.versionNumber}
              </DialogTitle>
              <DialogDescription>
                Comparaison section par section des deux versions du mémoire
              </DialogDescription>
            </DialogHeader>
            <MemoireVersionComparison comparison={comparisonData} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

