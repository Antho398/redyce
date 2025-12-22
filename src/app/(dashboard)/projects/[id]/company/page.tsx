/**
 * Page de configuration de l'entreprise pour un projet
 * Permet de personnaliser le profil, la méthodologie et les documents de référence
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import { formatFileSize, formatDate } from '@/lib/utils/document-helpers'

interface CompanyProfile {
  id: string
  userId: string
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
  { value: 'REFERENCE_MEMO', label: 'Mémoire de référence' },
  { value: 'EXAMPLE_ANSWER', label: 'Exemple de réponse' },
  { value: 'STYLE_GUIDE', label: 'Guide de style' },
]

export default function CompanyPage({
  params,
}: {
  params: { id: string }
}) {
  const projectId = params.id
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // États du profil
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    companyName: '',
    description: '',
    activities: '',
    workforce: '',
    equipment: '',
    qualitySafety: '',
    references: '',
  })

  // États de la méthodologie
  const [methodology, setMethodology] = useState({
    writingStyle: '',
    writingTone: '',
    writingGuidelines: '',
    forbiddenWords: '',
    preferredTerms: '',
    websiteUrl: '',
  })

  // Documents de référence
  const [documents, setDocuments] = useState<MethodologyDocument[]>([])
  const [selectedDocumentType, setSelectedDocumentType] = useState('REFERENCE_MEMO')

  // État pour les textes de chaque type
  const [textInputs, setTextInputs] = useState({
    REFERENCE_MEMO: '',
    EXAMPLE_ANSWER: '',
    STYLE_GUIDE: '',
  })

  // Mode d'entrée pour chaque type (file ou text)
  const [inputMode, setInputMode] = useState({
    REFERENCE_MEMO: 'file' as 'file' | 'text',
    EXAMPLE_ANSWER: 'file' as 'file' | 'text',
    STYLE_GUIDE: 'file' as 'file' | 'text',
  })

  useEffect(() => {
    fetchProfile()
    fetchDocuments()
  }, [projectId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company-profile')
      const data = await response.json()

      if (data.success && data.data) {
        const profileData = data.data
        setProfile({
          companyName: profileData.companyName || '',
          description: profileData.description || '',
          activities: profileData.activities || '',
          workforce: profileData.workforce || '',
          equipment: profileData.equipment || '',
          qualitySafety: profileData.qualitySafety || '',
          references: profileData.references || '',
        })
        setMethodology({
          writingStyle: profileData.writingStyle || '',
          writingTone: profileData.writingTone || '',
          writingGuidelines: profileData.writingGuidelines || '',
          forbiddenWords: profileData.forbiddenWords || '',
          preferredTerms: profileData.preferredTerms || '',
          websiteUrl: profileData.websiteUrl || '',
        })
      }
    } catch (err) {
      toast.error('Erreur', 'Impossible de charger le profil de l\'entreprise')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/methodology-documents')
      const data = await response.json()

      if (data.success && data.data) {
        setDocuments(data.data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profil sauvegardé', 'Le profil de l\'entreprise a été mis à jour')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMethodology = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/company-profile/methodology', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodology),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthodologie sauvegardée', 'Les paramètres ont été mis à jour')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté', 'Seuls les fichiers PDF, DOCX et DOC sont acceptés')
      return
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', 'La taille maximale est de 10 MB')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', selectedDocumentType)

      const response = await fetch('/api/methodology-documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document ajouté', 'Le document a été téléchargé avec succès')
        await fetchDocuments()
        // Réinitialiser l'input
        event.target.value = ''
      } else {
        throw new Error(data.error?.message || 'Erreur lors du téléchargement')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de télécharger le document')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveText = async (docType: string) => {
    const text = textInputs[docType as keyof typeof textInputs]
    if (!text.trim()) {
      toast.error('Erreur', 'Le texte ne peut pas être vide')
      return
    }

    try {
      setSaving(true)
      // Créer un fichier texte depuis le contenu
      const blob = new Blob([text], { type: 'text/plain' })
      const file = new File([blob], `${docType}_text.txt`, { type: 'text/plain' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)

      const response = await fetch('/api/methodology-documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Texte sauvegardé', 'Le texte a été enregistré comme document de référence')
        await fetchDocuments()
        // Réinitialiser le texte
        setTextInputs({ ...textInputs, [docType]: '' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder le texte')
    } finally {
      setSaving(false)
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
        toast.success('Document supprimé', 'Le document a été supprimé avec succès')
        await fetchDocuments()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer le document')
    } finally {
      setDeletingId(null)
    }
  }

  const getDocumentTypeBadge = (type: string) => {
    const docType = DOCUMENT_TYPES.find((t) => t.value === type)
    return (
      <Badge variant="secondary" className="text-xs">
        {docType?.label || type}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
        <ProjectHeader
          title="Entreprise"
          subtitle="Personnalisez vos réponses en intégrant des documents type"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader
        title="Entreprise"
        subtitle="Personnalisez vos réponses en intégrant des documents type"
      />

      {/* Bouton retour */}
      <div className="mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour au projet
        </HeaderLinkButton>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="methodology">Méthodologie</TabsTrigger>
          <TabsTrigger value="documents">Documents de référence</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Nom de l'entreprise
                </label>
                <Input
                  id="companyName"
                  value={profile.companyName || ''}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Ex: ACME Construction"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Présentation générale de l'entreprise..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="activities" className="text-sm font-medium">
                  Activités
                </label>
                <Textarea
                  id="activities"
                  value={profile.activities || ''}
                  onChange={(e) => setProfile({ ...profile, activities: e.target.value })}
                  placeholder="Liste des activités principales..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="workforce" className="text-sm font-medium">
                    Effectif
                  </label>
                  <Input
                    id="workforce"
                    value={profile.workforce || ''}
                    onChange={(e) => setProfile({ ...profile, workforce: e.target.value })}
                    placeholder="Ex: 50 salariés"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="equipment" className="text-sm font-medium">
                    Équipements
                  </label>
                  <Input
                    id="equipment"
                    value={profile.equipment || ''}
                    onChange={(e) => setProfile({ ...profile, equipment: e.target.value })}
                    placeholder="Ex: 10 engins, 15 véhicules"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="qualitySafety" className="text-sm font-medium">
                  Qualité & Sécurité
                </label>
                <Textarea
                  id="qualitySafety"
                  value={profile.qualitySafety || ''}
                  onChange={(e) => setProfile({ ...profile, qualitySafety: e.target.value })}
                  placeholder="Certifications, normes, démarches qualité..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="references" className="text-sm font-medium">
                  Références
                </label>
                <Textarea
                  id="references"
                  value={profile.references || ''}
                  onChange={(e) => setProfile({ ...profile, references: e.target.value })}
                  placeholder="Projets similaires réalisés..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Sauvegarder le profil
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Méthodologie */}
        <TabsContent value="methodology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Méthodologie rédactionnelle
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Ces paramètres seront utilisés par l'IA pour personnaliser les réponses du mémoire technique.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="writingStyle" className="text-sm font-medium">
                  Style de rédaction
                </label>
                <Input
                  id="writingStyle"
                  value={methodology.writingStyle || ''}
                  onChange={(e) => setMethodology({ ...methodology, writingStyle: e.target.value })}
                  placeholder="Ex: Concis et technique, Détaillé et argumenté..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="writingTone" className="text-sm font-medium">
                  Ton
                </label>
                <Input
                  id="writingTone"
                  value={methodology.writingTone || ''}
                  onChange={(e) => setMethodology({ ...methodology, writingTone: e.target.value })}
                  placeholder="Ex: Professionnel, Confiant, Pédagogique..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="writingGuidelines" className="text-sm font-medium">
                  Consignes spécifiques
                </label>
                <Textarea
                  id="writingGuidelines"
                  value={methodology.writingGuidelines || ''}
                  onChange={(e) => setMethodology({ ...methodology, writingGuidelines: e.target.value })}
                  placeholder="Directives particulières pour la rédaction..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="forbiddenWords" className="text-sm font-medium">
                    Mots à éviter
                  </label>
                  <Textarea
                    id="forbiddenWords"
                    value={methodology.forbiddenWords || ''}
                    onChange={(e) => setMethodology({ ...methodology, forbiddenWords: e.target.value })}
                    placeholder="Mots ou expressions à ne pas utiliser (séparés par des virgules)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="preferredTerms" className="text-sm font-medium">
                    Vocabulaire privilégié
                  </label>
                  <Textarea
                    id="preferredTerms"
                    value={methodology.preferredTerms || ''}
                    onChange={(e) => setMethodology({ ...methodology, preferredTerms: e.target.value })}
                    placeholder="Termes techniques ou expressions à favoriser (séparés par des virgules)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="websiteUrl" className="text-sm font-medium">
                  Site web (optionnel)
                </label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={methodology.websiteUrl || ''}
                  onChange={(e) => setMethodology({ ...methodology, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  L'URL du site de votre entreprise (pour enrichissement futur via scraping)
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveMethodology} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Sauvegarder la méthodologie
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Documents de référence */}
        <TabsContent value="documents" className="space-y-4">
          {/* Grid de 3 zones d'upload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map((docType) => (
              <Card key={docType.value}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {docType.label}
                  </CardTitle>
                  {/* Boutons pour changer de mode */}
                  <div className="flex gap-1 mt-2">
                    <Button
                      type="button"
                      variant={inputMode[docType.value as keyof typeof inputMode] === 'file' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => setInputMode({ ...inputMode, [docType.value]: 'file' })}
                    >
                      Fichier
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode[docType.value as keyof typeof inputMode] === 'text' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => setInputMode({ ...inputMode, [docType.value]: 'text' })}
                    >
                      Texte
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mode fichier */}
                  {inputMode[docType.value as keyof typeof inputMode] === 'file' ? (
                    <>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id={`file-upload-${docType.value}`}
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            setSelectedDocumentType(docType.value)
                            handleFileUpload(e)
                          }}
                          disabled={uploading}
                          className="hidden"
                        />
                        <label htmlFor={`file-upload-${docType.value}`} className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Glisser un fichier ou cliquer
                            </p>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        PDF, DOC, DOCX • Max 10 MB
                      </p>
                    </>
                  ) : (
                    /* Mode texte */
                    <>
                      <Textarea
                        value={textInputs[docType.value as keyof typeof textInputs]}
                        onChange={(e) => setTextInputs({ ...textInputs, [docType.value]: e.target.value })}
                        placeholder="Collez votre texte ici..."
                        rows={6}
                        className="text-xs"
                      />
                      <Button
                        onClick={() => handleSaveText(docType.value)}
                        disabled={saving || !textInputs[docType.value as keyof typeof textInputs].trim()}
                        size="sm"
                        className="w-full gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Liste des documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Documents importés ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg divide-y">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getDocumentTypeBadge(doc.documentType)}
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(doc.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingId === doc.id}
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
              </CardContent>
            </Card>
          )}

          {/* Aide */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Comment utiliser les documents de référence ?
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>
                      <strong>Mémoire de référence :</strong> Mémoires techniques complets déjà réalisés pour inspirer la structure et le contenu
                    </li>
                    <li>
                      <strong>Exemple de réponse :</strong> Réponses types à des questions similaires pour guider le style
                    </li>
                    <li>
                      <strong>Guide de style :</strong> Directives rédactionnelles ou chartes graphiques à respecter
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
