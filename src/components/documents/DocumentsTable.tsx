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
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils/document-helpers'
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string
  status: string
  requirementStatus?: string | null
  createdAt: string
}

interface DocumentsTableProps {
  documents: Document[]
  projectId: string
  onDelete: (documentId: string, documentName: string) => void
  deletingId: string | null
  onUpdate?: () => void
  onDocumentTypeChange?: (documentId: string, newType: string) => void
}

const DOCUMENT_TYPES = ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'MODELE_MEMOIRE', 'AUTRE'] as const

export function DocumentsTable({ documents, projectId, onDelete, deletingId, onUpdate, onDocumentTypeChange }: DocumentsTableProps) {
  const router = useRouter()
  const [updatingDocIds, setUpdatingDocIds] = React.useState<Set<string>>(new Set())
  const [extractingIds, setExtractingIds] = React.useState<Set<string>>(new Set())

  const handleExtractRequirements = async (documentId: string) => {
    setExtractingIds((prev) => new Set(prev).add(documentId))
    try {
      const response = await fetch(`/api/documents/${documentId}/extract-requirements`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Extraction lancée', 'L\'extraction des exigences est en cours...')
        // Recharger la liste des documents pour voir le statut updated
        if (onUpdate) {
          setTimeout(() => onUpdate(), 1000)
        }
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'extraction')
    } finally {
      setExtractingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

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

  const getAnalysisBadge = (document: Document) => {
    // Utiliser uniquement requirementStatus du document
    const analysisStatus = document.requirementStatus as 'WAITING' | 'PROCESSING' | 'DONE' | 'ERROR' | null

    switch (analysisStatus) {
      case 'WAITING':
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyse en cours
          </Badge>
        )
      case 'DONE':
        return (
          <Badge variant="accent" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Analysé
          </Badge>
        )
      case 'ERROR':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Taille</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Analyse</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.mimeType)
            return (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    {doc.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={doc.documentType || 'AUTRE'}
                    onValueChange={async (newType) => {
                      setUpdatingDocIds((prev) => new Set(prev).add(doc.id))
                      try {
                        const response = await fetch(`/api/documents/${doc.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ documentType: newType }),
                        })
                        if (response.ok) {
                          toast.success('Type de document mis à jour')
                          // Mise à jour locale au lieu de recharger toute la liste
                          onDocumentTypeChange?.(doc.id, newType)
                        } else {
                          throw new Error('Erreur lors de la mise à jour')
                        }
                      } catch (error) {
                        toast.error('Erreur', error instanceof Error ? error.message : 'Impossible de mettre à jour le type')
                      } finally {
                        setUpdatingDocIds((prev) => {
                          const newSet = new Set(prev)
                          newSet.delete(doc.id)
                          return newSet
                        })
                      }
                    }}
                    disabled={updatingDocIds.has(doc.id)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(doc.createdAt)}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>{getAnalysisBadge(doc)}</TableCell>
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
                      {/* Bouton extraction exigences : afficher si pas encore extrait ou en erreur */}
                      {(!doc.requirementStatus || doc.requirementStatus === 'ERROR') && (
                        <DropdownMenuItem
                          onClick={() => handleExtractRequirements(doc.id)}
                          disabled={extractingIds.has(doc.id)}
                        >
                          {extractingIds.has(doc.id) ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Extraire les exigences
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id, doc.name)}
                        className="text-destructive focus:text-destructive"
                        disabled={deletingId === doc.id}
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
    </>
  )
}
