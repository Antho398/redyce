/**
 * Carte d'avertissement pour le template mémoire requis
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText } from 'lucide-react'

interface Document {
  id: string
  name: string
  mimeType: string
}

interface TemplateWarningCardProps {
  documents: Document[]
  onCreateTemplate: (documentId: string) => Promise<void>
}

export function TemplateWarningCard({ documents, onCreateTemplate }: TemplateWarningCardProps) {
  const compatibleDocuments = documents.filter(
    (doc) => doc.mimeType.includes('pdf') || doc.mimeType.includes('word')
  )

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Template mémoire requis
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Vous devez d'abord uploader un template mémoire (DOCX ou PDF) pour pouvoir générer votre mémoire technique.
            </p>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Commencez par uploader votre template mémoire ci-dessous.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {compatibleDocuments.map((doc) => (
                  <Button
                    key={doc.id}
                    size="sm"
                    variant="outline"
                    onClick={() => onCreateTemplate(doc.id)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Utiliser "{doc.name}" comme template
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

