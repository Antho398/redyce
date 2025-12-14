/**
 * Tableau de liste des documents
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  MoreVertical,
  Eye,
  Download,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils/document-helpers'

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

interface DocumentsTableProps {
  documents: Document[]
  projectId: string
  onDelete: (documentId: string) => Promise<void>
  deletingId: string | null
}

export function DocumentsTable({ documents, projectId, onDelete, deletingId }: DocumentsTableProps) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="accent" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Traité
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            En cours
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        )
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Nom</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Taille</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => {
          const FileIcon = getFileIcon(doc.mimeType)
          return (
            <TableRow
              key={doc.id}
              className="hover:bg-accent/50 cursor-pointer"
              onClick={() => router.push(`/projects/${projectId}/documents/${doc.id}`)}
            >
              <TableCell className="font-medium text-sm">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.name}</span>
                  {doc.documentType === 'TEMPLATE_MEMOIRE' && (
                    <Badge variant="secondary" className="text-xs">
                      Template mémoire
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {doc.documentType ? (
                  <Badge variant="secondary" className="text-xs">
                    {doc.documentType}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatFileSize(doc.fileSize)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(doc.createdAt)}
              </TableCell>
              <TableCell>{getStatusBadge(doc.status)}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/projects/${projectId}/documents/${doc.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Téléchargement', 'Fonctionnalité à venir')}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(doc.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

