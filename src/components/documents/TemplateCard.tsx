/**
 * Composant pour afficher le statut du template mémoire
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  status: string
  metaJson?: {
    nbSections?: number
  }
}

interface TemplateCardProps {
  template: Template | null
  projectId: string
  onParse: () => Promise<void>
  parsing: boolean
}

export function TemplateCard({ template, projectId, onParse, parsing }: TemplateCardProps) {
  const router = useRouter()

  if (!template) {
    return null
  }

  const getStatusIcon = () => {
    switch (template.status) {
      case 'PARSED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'PARSING':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'FAILED':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (template.status) {
      case 'PARSED':
        return 'Parsé'
      case 'PARSING':
        return 'Parsing...'
      case 'FAILED':
        return 'Échec'
      default:
        return 'En attente'
    }
  }

  const getStatusDescription = () => {
    switch (template.status) {
      case 'PARSED':
        return `Le template a été analysé (${template.metaJson?.nbSections || 0} sections). Vous pouvez maintenant générer votre mémoire.`
      case 'PARSING':
        return 'Analyse du template en cours...'
      case 'FAILED':
        return "L'analyse du template a échoué. Réessayez ou contactez le support."
      default:
        return 'Analysez le template pour extraire les sections.'
    }
  }

  return (
    <Card className={template.status === 'PARSED' ? 'border-green-200 bg-green-50/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium text-foreground">
                Template mémoire : {getStatusText()}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStatusDescription()}
              </p>
            </div>
          </div>
          {template.status === 'UPLOADED' && (
            <Button
              size="sm"
              onClick={onParse}
              disabled={parsing}
              className="gap-2"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Parser le template
                </>
              )}
            </Button>
          )}
          {template.status === 'PARSED' && (
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/memoire`)}
              className="gap-2"
            >
              Aller au mémoire
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

