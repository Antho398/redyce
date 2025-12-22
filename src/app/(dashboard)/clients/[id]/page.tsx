/**
 * Page de détail d'un client
 * Permet de gérer le profil, la méthodologie et les documents de référence
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Building2,
  FileText,
  Upload,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  FileUp,
  Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { formatFileSize, formatDate } from '@/lib/utils/document-helpers'

interface Client {
  id: string
  name: string
  companyName?: string
  description?: string
  activities?: string
  workforce?: string
  equipment?: string
  qualitySafety?: string
  references?: string
  writingStyle?: string
  writingTone?: string
  writingGuidelines?: string
  forbiddenWords?: string
  preferredTerms?: string
  websiteUrl?: string
  _count?: {
    projects: number
    methodologyDocuments: number
  }
}

interface MethodologyDocument {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType: string
  createdAt: string
}

const DOCUMENT_TYPES = [
  { value: 'REFERENCE_MEMO', label: 'Mémoire de référence', description: 'Mémoires techniques passés pour référence' },
  { value: 'EXAMPLE_ANSWER', label: 'Exemple de réponse', description: 'Exemples de réponses réussies' },
  { value: 'STYLE_GUIDE', label: 'Guide de style', description: 'Guides de rédaction et de style' },
]

export default function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const clientId = params.id
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Client data
  const [client, setClient] = useState<Client | null>(null)

  // Documents de référence
  const [documents, setDocuments] = useState<MethodologyDocument[]>([])

  // Mode d'entrée pour chaque type (file ou text)
  const [inputMode, setInputMode] = useState({
    REFERENCE_MEMO: 'file' as 'file' | 'text',
    EXAMPLE_ANSWER: 'file' as 'file' | 'text',
    STYLE_GUIDE: 'file' as 'file' | 'text',
  })

  // État pour les textes de chaque type
  const [textInputs, setTextInputs] = useState({
    REFERENCE_MEMO: '',
    EXAMPLE_ANSWER: '',
    STYLE_GUIDE: '',
  })

  const [uploadingType, setUploadingType] = useState<string | null>(null)

  useEffect(() => {
    fetchClient()
    fetchDocuments()
  }, [clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()

      if (data.success) {
        setClient(data.data)
      } else {
        toast.error(data.error?.message || 'Erreur lors du chargement')
        router.push('/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/methodology-documents`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleProfileUpdate = async () => {
    if (!client) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: client.name,
          companyName: client.companyName,
          description: client.description,
          activities: client.activities,
          workforce: client.workforce,
          equipment: client.equipment,
          qualitySafety: client.qualitySafety,
          references: client.references,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profil mis à jour avec succès')
        setClient(data.data)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleMethodologyUpdate = async () => {
    if (!client) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clients/${clientId}/methodology`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writingStyle: client.writingStyle,
          writingTone: client.writingTone,
          writingGuidelines: client.writingGuidelines,
          forbiddenWords: client.forbiddenWords,
          preferredTerms: client.preferredTerms,
          websiteUrl: client.websiteUrl,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthodologie mise à jour avec succès')
        setClient(data.data)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating methodology:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (docType: string, file: File) => {
    try {
      setUploadingType(docType)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)
      formData.append('clientId', clientId)

      const response = await fetch('/api/methodology-documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document ajouté avec succès')
        fetchDocuments()
        // Reset file input
        const fileInput = document.querySelector(`input[data-type="${docType}"]`) as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        toast.error(data.error?.message || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setUploadingType(null)
    }
  }

  const handleSaveText = async (docType: string) => {
    const text = textInputs[docType as keyof typeof textInputs]
    if (!text.trim()) {
      toast.error('Le texte ne peut pas être vide')
      return
    }

    try {
      setUploadingType(docType)
      const blob = new Blob([text], { type: 'text/plain' })
      const file = new File([blob], `${docType}_text.txt`, { type: 'text/plain' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)
      formData.append('clientId', clientId)

      const response = await fetch('/api/methodology-documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Texte enregistré avec succès')
        fetchDocuments()
        setTextInputs((prev) => ({ ...prev, [docType]: '' }))
      } else {
        toast.error(data.error?.message || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving text:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setUploadingType(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingId(documentId)
      const response = await fetch(`/api/methodology-documents/${documentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document supprimé')
        fetchDocuments()
      } else {
        toast.error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setDeletingId(null)
    }
  }

  const getDocumentsByType = (type: string) => {
    return documents.filter((doc) => doc.documentType === type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du client...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">Client introuvable</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-3 py-4 px-4">
      <ProjectHeader
        title={client.name}
        subtitle={client.companyName || 'Client'}
        primaryAction={
          <Button
            onClick={() => router.push('/clients')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{client._count?.projects || 0}</p>
                <p className="text-xs text-muted-foreground">Projets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{client._count?.methodologyDocuments || 0}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="methodology">Méthodologie</TabsTrigger>
          <TabsTrigger value="documents">Documents de référence</TabsTrigger>
        </TabsList>

        {/* Tab Profil */}
        <TabsContent value="profile" className="space-y-3">
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Profil du client</h2>
                <Button onClick={handleProfileUpdate} disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du client</Label>
                  <Input
                    id="name"
                    value={client.name || ''}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    placeholder="Nom d'affichage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Raison sociale</Label>
                  <Input
                    id="companyName"
                    value={client.companyName || ''}
                    onChange={(e) => setClient({ ...client, companyName: e.target.value })}
                    placeholder="Nom officiel de l'entreprise"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={client.description || ''}
                  onChange={(e) => setClient({ ...client, description: e.target.value })}
                  placeholder="Brève description de l'entreprise"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activities">Activités principales</Label>
                <Textarea
                  id="activities"
                  value={client.activities || ''}
                  onChange={(e) => setClient({ ...client, activities: e.target.value })}
                  placeholder="Décrivez les activités principales"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workforce">Main d'œuvre et compétences</Label>
                <Textarea
                  id="workforce"
                  value={client.workforce || ''}
                  onChange={(e) => setClient({ ...client, workforce: e.target.value })}
                  placeholder="Effectif, compétences, qualifications..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Matériel et équipements</Label>
                <Textarea
                  id="equipment"
                  value={client.equipment || ''}
                  onChange={(e) => setClient({ ...client, equipment: e.target.value })}
                  placeholder="Matériel technique, parc machines..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualitySafety">Qualité et sécurité</Label>
                <Textarea
                  id="qualitySafety"
                  value={client.qualitySafety || ''}
                  onChange={(e) => setClient({ ...client, qualitySafety: e.target.value })}
                  placeholder="Certifications, normes, démarches qualité..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">Références clients</Label>
                <Textarea
                  id="references"
                  value={client.references || ''}
                  onChange={(e) => setClient({ ...client, references: e.target.value })}
                  placeholder="Projets antérieurs, références marquantes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Méthodologie */}
        <TabsContent value="methodology" className="space-y-3">
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Méthodologie rédactionnelle</h2>
                <Button onClick={handleMethodologyUpdate} disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="writingStyle">Style de rédaction</Label>
                <Textarea
                  id="writingStyle"
                  value={client.writingStyle || ''}
                  onChange={(e) => setClient({ ...client, writingStyle: e.target.value })}
                  placeholder="Ex: Formel, technique, concis..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="writingTone">Ton</Label>
                <Textarea
                  id="writingTone"
                  value={client.writingTone || ''}
                  onChange={(e) => setClient({ ...client, writingTone: e.target.value })}
                  placeholder="Ex: Professionnel, confiant, accessible..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="writingGuidelines">Consignes spécifiques</Label>
                <Textarea
                  id="writingGuidelines"
                  value={client.writingGuidelines || ''}
                  onChange={(e) => setClient({ ...client, writingGuidelines: e.target.value })}
                  placeholder="Règles de rédaction à respecter..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forbiddenWords">Mots à éviter</Label>
                <Input
                  id="forbiddenWords"
                  value={client.forbiddenWords || ''}
                  onChange={(e) => setClient({ ...client, forbiddenWords: e.target.value })}
                  placeholder="Mots ou expressions à ne pas utiliser (séparés par des virgules)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTerms">Vocabulaire privilégié</Label>
                <Input
                  id="preferredTerms"
                  value={client.preferredTerms || ''}
                  onChange={(e) => setClient({ ...client, preferredTerms: e.target.value })}
                  placeholder="Termes à favoriser (séparés par des virgules)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Site web</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={client.websiteUrl || ''}
                  onChange={(e) => setClient({ ...client, websiteUrl: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documents */}
        <TabsContent value="documents" className="space-y-3">
          <div className="grid grid-cols-1 gap-4">
            {DOCUMENT_TYPES.map((docType) => {
              const docs = getDocumentsByType(docType.value)
              const mode = inputMode[docType.value as keyof typeof inputMode]
              const isUploading = uploadingType === docType.value

              return (
                <Card key={docType.value}>
                  <CardHeader className="border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{docType.label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{docType.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {docs.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={mode === 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setInputMode((prev) => ({ ...prev, [docType.value]: 'file' }))
                        }
                        className="gap-2"
                      >
                        <FileUp className="h-4 w-4" />
                        Fichier
                      </Button>
                      <Button
                        type="button"
                        variant={mode === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setInputMode((prev) => ({ ...prev, [docType.value]: 'text' }))
                        }
                        className="gap-2"
                      >
                        <Type className="h-4 w-4" />
                        Texte
                      </Button>
                    </div>

                    {/* Upload zone ou textarea selon le mode */}
                    {mode === 'file' ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Glissez un fichier ou cliquez pour sélectionner
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(docType.value, file)
                          }}
                          data-type={docType.value}
                          className="hidden"
                          id={`file-${docType.value}`}
                          disabled={isUploading}
                        />
                        <label htmlFor={`file-${docType.value}`}>
                          <Button size="sm" disabled={isUploading} asChild>
                            <span>
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Upload...
                                </>
                              ) : (
                                'Sélectionner un fichier'
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          value={textInputs[docType.value as keyof typeof textInputs]}
                          onChange={(e) =>
                            setTextInputs((prev) => ({
                              ...prev,
                              [docType.value]: e.target.value,
                            }))
                          }
                          placeholder={`Entrez le contenu du ${docType.label.toLowerCase()}...`}
                          rows={6}
                          disabled={isUploading}
                        />
                        <Button
                          onClick={() => handleSaveText(docType.value)}
                          disabled={
                            isUploading ||
                            !textInputs[docType.value as keyof typeof textInputs].trim()
                          }
                          size="sm"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Enregistrer le texte
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Liste des documents */}
                    {docs.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deletingId === doc.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
