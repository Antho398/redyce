/**
 * Section Sources - Affiche les documents sources d'un livrable
 * Composant réutilisable pour tous les types de livrables
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react'
import { DocumentSource } from '@/types/livrables'
import { useRouter } from 'next/navigation'

interface LivrableSourcesSectionProps {
  documents: DocumentSource[]
  loading?: boolean
  projectId: string
  onUpload?: () => void
}

export function LivrableSourcesSection({
  documents,
  loading = false,
  projectId,
  onUpload,
}: LivrableSourcesSectionProps) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      uploaded: 'Uploadé',
      processing: 'En cours...',
      processed: 'Analysé',
      error: 'Erreur',
    }
    return labels[status] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const analyzedCount = documents.filter((d) => d.status === 'processed').length
  const processingCount = documents.filter((d) => d.status === 'processing').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Documents sources</CardTitle>
          {onUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/documents`)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Ajouter des documents
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucun document source n'a été ajouté à ce projet.
            </p>
            {onUpload && (
              <Button
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/documents`)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Ajouter des documents
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats rapides */}
            {(analyzedCount > 0 || processingCount > 0) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {analyzedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {analyzedCount} analysé{analyzedCount > 1 ? 's' : ''}
                  </span>
                )}
                {processingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    {processingCount} en cours
                  </span>
                )}
              </div>
            )}

            {/* Tableau des documents */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase">Nom</TableHead>
                  <TableHead className="text-xs uppercase">Type</TableHead>
                  <TableHead className="text-xs uppercase">Statut</TableHead>
                  <TableHead className="text-xs uppercase">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-sm">
                      {doc.name}
                    </TableCell>
                    <TableCell>
                      {doc.documentType ? (
                        <Badge variant="secondary" className="text-xs">
                          {doc.documentType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <span className="text-sm">{getStatusLabel(doc.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

