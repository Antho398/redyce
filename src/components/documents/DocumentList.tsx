/**
 * Composant de liste de documents
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string
  status: string
  createdAt: string
}

interface DocumentListProps {
  projectId: string
  onDocumentClick?: (documentId: string) => void
}

export function DocumentList({ projectId, onDocumentClick }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/documents`)
      const data = await response.json()

      if (data.success && data.data) {
        setDocuments(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

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
      processing: 'Traitement...',
      processed: 'Traité',
      error: 'Erreur',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Chargement des documents...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
          <p className="text-sm text-destructive font-medium mb-4">{error}</p>
          <Button onClick={fetchDocuments} variant="outline" className="rounded-md">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button onClick={fetchDocuments} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-base font-medium mb-2">Aucun document pour l'instant</p>
            <p className="text-sm text-gray-400">
              Ajoutez un CCTP, DPGF, RC, CCAP ou tout autre document technique
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/30 cursor-pointer transition-colors"
                onClick={() => onDocumentClick?.(doc.id)}
              >
                <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </span>
                    {doc.documentType && (
                      <Badge variant="secondary" className="text-xs rounded-full">
                        {doc.documentType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(doc.status)}
                  <span className="text-xs text-muted-foreground">{getStatusLabel(doc.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

