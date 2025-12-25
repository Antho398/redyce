/**
 * Composant d'avertissement si l'extraction des exigences est incomplète
 * Affiche un warning non bloquant avec statut en temps réel
 * Affiche un toast quand l'extraction est terminée
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface ExtractionStatus {
  total: number
  done: number
  processing: number
  waiting: number
  error: number
  requirementsCount: number
}

interface RequirementsExtractionWarningProps {
  projectId: string
  onStatusChange?: (isComplete: boolean) => void
}

export function RequirementsExtractionWarning({ projectId, onStatusChange }: RequirementsExtractionWarningProps) {
  const [status, setStatus] = useState<ExtractionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const wasInProgressRef = useRef(false)
  const hasNotifiedRef = useRef(false)

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements-status`)
      const data = await response.json()
      if (data.success && data.data) {
        const newStatus = data.data
        const isComplete = newStatus.processing === 0 && newStatus.waiting === 0

        // Notifier par toast si l'extraction vient de se terminer
        if (wasInProgressRef.current && isComplete && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          if (newStatus.error === 0) {
            toast.success('Extraction des exigences terminée', {
              description: `${newStatus.requirementsCount} exigences extraites de ${newStatus.done} documents`,
            })
          } else {
            toast.warning('Extraction des exigences terminée avec des erreurs', {
              description: `${newStatus.requirementsCount} exigences extraites, ${newStatus.error} document(s) en erreur`,
            })
          }
        }

        // Mémoriser si on était en cours de traitement
        if (newStatus.processing > 0 || newStatus.waiting > 0) {
          wasInProgressRef.current = true
          hasNotifiedRef.current = false
        }

        setStatus(newStatus)
        onStatusChange?.(isComplete)
      }
    } catch (err) {
      console.error('Error checking requirements status:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId, onStatusChange])

  useEffect(() => {
    checkStatus()

    // Polling toutes les 5 secondes si des extractions sont en cours
    const interval = setInterval(() => {
      if (status && (status.processing > 0 || status.waiting > 0)) {
        checkStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [checkStatus, status])

  if (loading) {
    return null
  }

  // Pas de documents = pas de warning
  if (!status || status.total === 0) {
    return null
  }

  const isComplete = status.processing === 0 && status.waiting === 0
  const hasErrors = status.error > 0

  // Tout est terminé et sans erreur = pas de warning
  if (isComplete && !hasErrors) {
    return null
  }

  // En cours d'extraction
  if (status.processing > 0 || status.waiting > 0) {
    const inProgress = status.processing + status.waiting
    const progressPercent = Math.round((status.done / status.total) * 100)

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Extraction des exigences en cours ({progressPercent}%)
              </p>
              <p className="text-sm text-blue-800 mb-2">
                {status.done}/{status.total} documents analysés • {status.requirementsCount} exigences extraites
              </p>
              <p className="text-xs text-blue-700">
                Pour un rendu optimal, nous conseillons d'attendre la fin de l'extraction.
                Vous pouvez néanmoins commencer à générer des réponses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Des erreurs d'extraction
  if (hasErrors) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">
                Extraction incomplète ({status.error} erreur{status.error > 1 ? 's' : ''})
              </p>
              <p className="text-sm text-amber-800 mb-3">
                {status.done}/{status.total} documents analysés • {status.requirementsCount} exigences extraites.
                Certains documents n'ont pas pu être analysés.
              </p>
              <Button variant="outline" size="sm" onClick={checkStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Vérifier le statut
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
