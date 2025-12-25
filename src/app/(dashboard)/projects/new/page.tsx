/**
 * Page de création de projet
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toastSuccess, toastError } from '@/lib/toast'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'

interface Client {
  id: string
  name: string
  companyName?: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [client, setClient] = useState<Client | null>(null)
  const [loadingClient, setLoadingClient] = useState(!!preselectedClientId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Charger les informations du client si on a un clientId
  useEffect(() => {
    if (preselectedClientId) {
      fetchClient(preselectedClientId)
    }
  }, [preselectedClientId])

  const fetchClient = async (clientId: string) => {
    try {
      setLoadingClient(true)
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setClient(data.data)
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoadingClient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          clientId: preselectedClientId || undefined,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        toastSuccess('Projet créé', `Le projet "${name}" a été créé avec succès.`)
        router.push(`/projects/${data.data.id}`)
      } else {
        const errorMsg = data.error?.message || 'Erreur lors de la création du projet'
        setError(errorMsg)
        toastError('Erreur', errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMsg)
      toastError('Erreur', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 min-h-[calc(100vh-var(--app-header-height))] flex flex-col">
      <ProjectHeader
        title="Nouveau Projet"
        subtitle="Créez un nouveau projet pour commencer à uploader des documents"
      />

      <div className="flex items-center gap-3 mt-4">
        <HeaderLinkButton
          href={preselectedClientId ? `/clients/${preselectedClientId}/projects` : '/projects'}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour aux projets
        </HeaderLinkButton>
      </div>

      <div className="flex-1 flex items-center justify-center pt-4 pb-24">
        <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer votre projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label>Client</Label>
              <div className="mt-1 p-2 bg-muted/50 border rounded-md text-sm">
                {loadingClient ? (
                  <span className="text-muted-foreground">Chargement...</span>
                ) : client ? (
                  <span className="font-medium">
                    {client.name} {client.companyName ? `(${client.companyName})` : ''}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Client non trouvé</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name">
                Nom du projet <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Rénovation École Primaire"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre projet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(preselectedClientId ? `/clients/${preselectedClientId}/projects` : '/projects')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={loading || !name.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le projet'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

