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
  Edit,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils/document-helpers'
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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
  onDelete: (documentId: string, documentName: string) => void
  deletingId: string | null
  onUpdate?: () => void
}

const DOCUMENT_TYPES = ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'MODELE_MEMOIRE', 'AUTRE'] as const

export function DocumentsTable({ documents, projectId, onDelete, deletingId, onUpdate }: DocumentsTableProps) {
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null)
  const [newDocumentType, setNewDocumentType] = React.useState<string>('')
  const [updating, setUpdating] = React.useState(false)

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
    <>
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
                  {doc.documentType === 'MODELE_MEMOIRE' && (
                    <Badge variant="secondary" className="text-xs">
                      Template mémoire
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {doc.documentType ? (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      setEditingDoc(doc)
                      setNewDocumentType(doc.documentType || '')
                      setEditDialogOpen(true)
                    }}
                  >
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
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingDoc(doc)
                        setNewDocumentType(doc.documentType || '')
                        setEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le type
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Téléchargement', 'Fonctionnalité à venir')}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </DropdownMenuItem>
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

    {/* Dialog pour modifier le type de document */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le type de document</DialogTitle>
          <DialogDescription>
            Modifier le type de document pour {editingDoc?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Type de document</Label>
            <Select value={newDocumentType} onValueChange={setNewDocumentType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={updating}
          >
            Annuler
          </Button>
          <Button
            onClick={async () => {
              if (!editingDoc || !newDocumentType) return
              
              setUpdating(true)
              try {
                const response = await fetch(`/api/documents/${editingDoc.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ documentType: newDocumentType }),
                })

                const data = await response.json()

                if (data.success) {
                  toast.success('Type modifié', 'Le type de document a été mis à jour')
                  setEditDialogOpen(false)
                  onUpdate?.()
                } else {
                  throw new Error(data.error?.message || 'Erreur lors de la mise à jour')
                }
              } catch (error) {
                toast.error('Erreur', error instanceof Error ? error.message : 'Impossible de modifier le type')
              } finally {
                setUpdating(false)
              }
            }}
            disabled={updating || !newDocumentType}
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}

