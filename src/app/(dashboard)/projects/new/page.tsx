/**
 * Page de création de projet
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toastSuccess, toastError } from '@/lib/toast'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined }),
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Nouveau Projet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez un nouveau projet pour commencer à uploader des documents
          </p>
        </div>
      </div>

      <Card>
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
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom du projet <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (optionnel)
              </label>
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
                onClick={() => router.push('/projects')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
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
  )
}

