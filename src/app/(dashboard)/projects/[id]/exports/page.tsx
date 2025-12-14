/**
 * Page des exports et versions du mémoire technique
 * Design compact, professionnel - Redyce V1
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  FileText,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectExportsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [loading, setLoading] = useState(true)
  const [exports, setExports] = useState<any[]>([])

  useEffect(() => {
    // TODO: Charger les exports depuis l'API
    setLoading(false)
  }, [projectId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-primary/5 via-accent/10 to-[#F8D347]/25 rounded-lg p-3 -mx-4 px-4">
        <div>
          <h1 className="text-xl font-semibold">Exports & versions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique des exports DOCX du mémoire technique
          </p>
        </div>
      </div>

      {/* Liste des exports */}
      {exports.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
          <CardContent className="flex flex-col items-center text-center py-8 px-4">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucun export</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Les exports DOCX du mémoire technique apparaîtront ici une fois générés.
            </p>
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/memoire`)}
            >
              Aller au mémoire technique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exports disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportItem) => (
                  <TableRow key={exportItem.id}>
                    <TableCell className="font-medium text-sm">
                      Version {exportItem.version}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(exportItem.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Disponible
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

