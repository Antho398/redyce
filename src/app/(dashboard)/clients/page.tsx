/**
 * Page de liste des clients - Design System Redyce V1
 * Style compact, professionnel, dense
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Building2, AlertCircle, Eye, Pencil, Trash2, MoreVertical, FileText, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'

interface Client {
  id: string
  name: string
  companyName?: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    projects: number
    methodologyDocuments: number
  }
}

export default function ClientsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/clients')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClients()
    }
  }, [status])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/clients')

      // Si redirection vers login (401)
      if (response.status === 401 || response.redirected) {
        router.push('/login?callbackUrl=/clients')
        return
      }

      const data = await response.json()

      if (data.success && data.data) {
        setClients(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des clients')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDeleteClick = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation()
    setClientToDelete(client)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Client supprimé avec succès')
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id))
        setShowDeleteDialog(false)
        setClientToDelete(null)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setDeleting(false)
    }
  }

  // Afficher le loader pendant la vérification de session ou le chargement
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des clients...</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si non authentifié (redirection en cours)
  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive font-medium text-sm">{error}</p>
          <Button onClick={fetchClients} variant="outline" size="sm">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader
        title="Clients"
        subtitle="Gérez vos entreprises clientes et leur méthodologie"
        primaryAction={
          <Button
            onClick={() => router.push('/clients/new')}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {/* Contenu */}
      {clients.length === 0 ? (
        <EmptyClientsState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nom du client</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="text-right">Projets</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const projectCount = client._count?.projects || 0
                  const docCount = client._count?.methodologyDocuments || 0

                  return (
                    <TableRow
                      key={client.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell className="font-medium text-sm">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.companyName || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                          <FolderOpen className="h-4 w-4" />
                          <span>{projectCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{docCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(client.updatedAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/clients/${client.id}`)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(client, e)}
                              className="text-destructive focus:text-destructive"
                              disabled={deleting && clientToDelete?.id === client.id}
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
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setClientToDelete(null)
        }}
        title="Supprimer ce client ?"
        description="Cette action est irréversible. Les projets associés ne seront plus liés à ce client."
        itemName={clientToDelete?.name}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}

/**
 * État vide compact - Design System V1
 */
function EmptyClientsState() {
  const router = useRouter()

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
      <CardContent className="flex flex-col items-center text-center py-12 px-4">
        <div className="mb-4">
          <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucun client
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Créez votre premier client pour gérer leurs projets et leur méthodologie rédactionnelle.
        </p>
        <Button
          onClick={() => router.push('/clients/new')}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Créer un client
        </Button>
      </CardContent>
    </Card>
  )
}
