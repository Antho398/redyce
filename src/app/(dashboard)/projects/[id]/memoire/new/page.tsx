/**
 * Page de création d'un nouveau mémoire technique
 * Wizard minimal : sélection du template + titre
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Document {
  id: string
  name: string
  fileName: string
  documentType?: string
}

export default function NewMemoPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [memoTitle, setMemoTitle] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/documents`)
      const data = await response.json()

      if (data.success && data.data) {
        // Filtrer uniquement les documents de type TEMPLATE_MEMOIRE
        const templates = data.data.filter(
          (doc: Document) => doc.documentType === 'TEMPLATE_MEMOIRE'
        )
        setDocuments(templates)

        // Pré-sélectionner le premier template si disponible
        if (templates.length === 1) {
          setSelectedTemplateId(templates[0].id)
        }
      } else {
        toast.error(data.error?.message || 'Erreur lors du chargement des documents')
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des documents')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMemo = async () => {
    if (!selectedTemplateId) {
      toast.error('Veuillez sélectionner un modèle de mémoire')
      return
    }

    if (!memoTitle.trim()) {
      toast.error('Veuillez renseigner un titre pour le mémoire')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateDocumentId: selectedTemplateId,
          title: memoTitle.trim(),
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        toast.success('Mémoire créé avec succès')
        router.push(`/projects/${projectId}/memoire`)
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
      console.error('Error creating memo:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const templatesAvailable = documents.length > 0

  return (
    <div className="max-w-3xl mx-auto py-6 px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${projectId}/memoire`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Nouveau mémoire technique</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez un nouveau mémoire technique pour ce projet
          </p>
        </div>
      </div>

      {/* Warning si aucun template */}
      {!templatesAvailable && (
        <Card className="border-l-4 border-yellow-500 bg-yellow-50/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  Aucun modèle de mémoire disponible
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Veuillez uploader un document de type TEMPLATE_MEMOIRE ou MODELE_MEMOIRE.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/documents`)}
              >
                Aller aux documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du mémoire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">
              Titre du mémoire <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="Mémoire technique - Version 1"
              className="mt-1"
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Donnez un nom clair à votre mémoire technique
            </p>
          </div>

          <div>
            <Label htmlFor="template">
              Modèle de mémoire client <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={creating || !templatesAvailable}
            >
              <SelectTrigger id="template" className="mt-1">
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{doc.name || doc.fileName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!templatesAvailable && (
              <p className="text-xs text-muted-foreground mt-1">
                Aucun template disponible. Uploader un document de type <strong>TEMPLATE_MEMOIRE</strong> dans la page Documents.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href={`/projects/${projectId}/memoire`}>
              <Button variant="outline" disabled={creating}>
                Annuler
              </Button>
            </Link>
            <Button
              onClick={handleCreateMemo}
              disabled={creating || !selectedTemplateId || !memoTitle.trim() || !templatesAvailable}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Créer le mémoire
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

