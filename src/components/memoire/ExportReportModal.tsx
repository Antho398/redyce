/**
 * Modal d'affichage du rapport d'export DOCX
 * Affiche les statistiques et détails de l'injection des réponses
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

export interface InjectionReport {
  totalQuestions: number
  injectedCount: number
  missingCount: number
  notFoundCount: number
  details: Array<{
    questionId: string
    placeholder: string
    questionTitle: string
    status: 'injected' | 'missing' | 'not_found'
    answerPreview?: string
    error?: string
  }>
  success: boolean
  warnings: string[]
  exportedAt: Date
  durationMs: number
}

interface ExportReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: InjectionReport | null
  fileName: string
  onDownload: () => void
}

export function ExportReportModal({
  open,
  onOpenChange,
  report,
  fileName,
  onDownload,
}: ExportReportModalProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!report) return null

  const successRate = report.totalQuestions > 0 
    ? Math.round((report.injectedCount / report.totalQuestions) * 100) 
    : 0

  const getStatusIcon = (status: 'injected' | 'missing' | 'not_found') => {
    switch (status) {
      case 'injected':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case 'not_found':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusLabel = (status: 'injected' | 'missing' | 'not_found') => {
    switch (status) {
      case 'injected':
        return 'Injecté'
      case 'missing':
        return 'À compléter'
      case 'not_found':
        return 'Non trouvé'
    }
  }

  const getStatusBadgeVariant = (status: 'injected' | 'missing' | 'not_found') => {
    switch (status) {
      case 'injected':
        return 'default'
      case 'missing':
        return 'secondary'
      case 'not_found':
        return 'destructive'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport d'export DOCX
          </DialogTitle>
          <DialogDescription>
            {report.success 
              ? 'Export terminé avec succès.'
              : 'Export terminé avec des avertissements.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Statistiques principales */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Questions"
              value={report.totalQuestions}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              label="Injectées"
              value={report.injectedCount}
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
              variant="success"
            />
            <StatCard
              label="Manquantes"
              value={report.missingCount}
              icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
              variant={report.missingCount > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Non trouvées"
              value={report.notFoundCount}
              icon={<XCircle className="h-4 w-4 text-red-600" />}
              variant={report.notFoundCount > 0 ? 'error' : 'default'}
            />
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taux de complétion</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Avertissements */}
          {report.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                <AlertCircle className="h-4 w-4" />
                Avertissements
              </div>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                {report.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Message de succès */}
          {report.success && report.warnings.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Toutes les réponses ont été injectées avec succès !
              </div>
            </div>
          )}

          {/* Détails (accordéon) */}
          <div className="border rounded-lg">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>Détails par question</span>
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {showDetails && (
              <div className="border-t max-h-[200px] overflow-auto">
                <div className="divide-y">
                  {report.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-start gap-3 hover:bg-muted/30"
                    >
                      <div className="mt-0.5">
                        {getStatusIcon(detail.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {detail.questionTitle}
                          </span>
                          <Badge 
                            variant={getStatusBadgeVariant(detail.status) as 'default' | 'secondary' | 'destructive'}
                            className="text-xs"
                          >
                            {getStatusLabel(detail.status)}
                          </Badge>
                        </div>
                        {detail.answerPreview && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {detail.answerPreview}
                          </p>
                        )}
                        {detail.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {detail.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Exporté le {new Date(report.exportedAt).toLocaleString('fr-FR')}
            </span>
            <span>
              Durée : {report.durationMs}ms
            </span>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger {fileName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Composant carte de statistique
function StatCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: number
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantClasses = {
    default: 'bg-card border',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`rounded-lg p-3 border ${variantClasses[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}


