/**
 * Carte pour les documents de contexte (AO)
 * - Upload multi-documents
 * - Table des documents hors template mémoire
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, AlertCircle } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { cn } from '@/lib/utils/helpers'

interface DocumentItem {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string
  status: string
  createdAt: string
}

interface ProjectDocumentsCardProps {
  projectId: string
  documents: DocumentItem[]
  deletingId: string | null
  error?: string | null
  pendingFilesCount: number
  onUploadComplete: (documentId?: string) => Promise<void> | void
  onDelete: (documentId: string, documentName: string) => void
  onPendingFilesChange?: (count: number) => void
  onRetry?: () => void
  showTable?: boolean
  hasDocuments?: boolean // Indique si des documents sont chargés (pour ajuster l'espacement dans DocumentUpload)
  hasTemplate?: boolean // Indique si un template mémoire est chargé
}

export function ProjectDocumentsCard({
  projectId,
  documents,
  deletingId,
  error,
  pendingFilesCount,
  onUploadComplete,
  onDelete,
  onPendingFilesChange,
  onRetry,
  showTable = true,
  hasDocuments: hasDocumentsProp,
  hasTemplate: hasTemplateProp,
}: ProjectDocumentsCardProps) {
  const hasDocuments = documents.length > 0

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* En-tête uniformisé */}
        <div className="bg-muted/50 border border-border rounded-md p-3">
          <span className="text-sm font-medium text-foreground">Documents de contexte (AO)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Servent à répondre aux questions du mémoire
        </p>

        {/* Zone d'upload */}
        <div className={cn(hasTemplateProp ? "mt-6" : "mt-3")}>
          <DocumentUpload
            projectId={projectId}
            onUploadComplete={onUploadComplete}
            onPendingFilesChange={onPendingFilesChange}
            alignOffset="mt-[25.6px]"
            hasDocuments={hasDocumentsProp}
            hasTemplate={hasTemplateProp}
          />
        </div>

        {showTable && (
          <div className="mt-3">
            {error ? (
              <div className="flex flex-col items-center justify-center gap-3 border rounded-md py-6">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
                {onRetry && (
                  <Button onClick={onRetry} variant="outline" size="sm">
                    Réessayer
                  </Button>
                )}
              </div>
            ) : hasDocuments ? (
              <DocumentsTable
                documents={documents}
                projectId={projectId}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            ) : pendingFilesCount > 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md py-4 px-3">
                Fichiers prêts à être importés
              </div>
            ) : (
              <div className="text-sm text-muted-foreground border rounded-md py-4 px-3">
                Aucun document de contexte pour l'instant. Importez vos AO/RC/CCAP/CCTP/DPGF.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


