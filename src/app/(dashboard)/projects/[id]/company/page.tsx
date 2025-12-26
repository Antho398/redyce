/**
 * Page de configuration de l'entreprise cliente pour un projet
 * Permet de personnaliser le profil, la méthodologie et les documents de référence du client
 */

'use client'

import { useState, useEffect } from 'react'
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
  Sparkles,
  HardHat,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import { formatFileSize, formatDate } from '@/lib/utils/document-helpers'
import { ExtractionProgressBar } from '@/components/company/ExtractionProgressBar'

interface ClientProfile {
  companyName?: string | null
  description?: string | null
  activities?: string | null
  workforce?: string | null
  equipment?: string | null
  qualitySafety?: string | null
  references?: string | null
  // Méthodologie de travail
  workMethodology?: string | null
  siteOccupied?: string | null
  // Méthodologie rédactionnelle
  writingStyle?: string | null
  writingTone?: string | null
  writingGuidelines?: string | null
  forbiddenWords?: string | null
  preferredTerms?: string | null
  websiteUrl?: string | null
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
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtractingTemp, setIsExtractingTemp] = useState(false)

  // Client info
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState<string>('')

  // États du profil
  const [profile, setProfile] = useState<Partial<ClientProfile>>({
    companyName: '',
    description: '',
    activities: '',
    workforce: '',
    equipment: '',
    qualitySafety: '',
    references: '',
  })

  // États de la méthodologie de travail
  const [workMethodology, setWorkMethodology] = useState({
    workMethodology: '',
    siteOccupied: '',
  })

  // États de la méthodologie rédactionnelle
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

  // État pour détecter si le profil a été modifié (pour le tutoriel)
  const [isProfileDirty, setIsProfileDirty] = useState(false)

  // Wrapper pour setProfile qui marque aussi le profil comme modifié
  const updateProfile = (updates: Partial<ClientProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
    setIsProfileDirty(true)
  }


  useEffect(() => {
    fetchProjectAndClient()
  }, [projectId])

  // Charger le profil et documents quand on a le clientId
  useEffect(() => {
    if (clientId) {
      fetchProfile()
      fetchDocuments()
    }
  }, [clientId])

  // Auto-resize des textareas au chargement des donnees et changement d'onglet
  useEffect(() => {
    // Petit délai pour laisser le DOM se mettre à jour après le changement d'onglet
    const timer = setTimeout(() => {
      const textareas = document.querySelectorAll('textarea')
      textareas.forEach((textarea) => {
        if (textarea.value) {
          textarea.style.height = 'auto'
          textarea.style.height = textarea.scrollHeight + 'px'
        }
      })
    }, 50)
    return () => clearTimeout(timer)
  }, [profile, workMethodology, methodology, activeTab])

  const fetchProjectAndClient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        const project = data.data
        if (project.clientId) {
          setClientId(project.clientId)
          setClientName(project.client?.name || 'Client')
        } else {
          toast.error('Aucun client associé', { description: 'Ce projet n\'a pas de client associé' })
          setLoading(false)
        }
      } else {
        toast.error('Erreur', { description: 'Impossible de charger le projet' })
        setLoading(false)
      }
    } catch (err) {
      toast.error('Erreur', { description: 'Impossible de charger le projet' })
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    if (!clientId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}/profile`)
      const data = await response.json()

      if (data.success && data.data) {
        const { profile: profileData, clientName: name } = data.data
        if (name) setClientName(name)

        setProfile({
          companyName: profileData.companyName || '',
          description: profileData.description || '',
          activities: profileData.activities || '',
          workforce: profileData.workforce || '',
          equipment: profileData.equipment || '',
          qualitySafety: profileData.qualitySafety || '',
          references: profileData.references || '',
        })
        setWorkMethodology({
          workMethodology: profileData.workMethodology || '',
          siteOccupied: profileData.siteOccupied || '',
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
      toast.error('Erreur', { description: 'Impossible de charger le profil du client' })
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
    if (!clientId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profil sauvegardé', { description: 'Le profil du client a été mis à jour' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de sauvegarder' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMethodology = async () => {
    if (!clientId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clients/${clientId}/methodology`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodology),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthodologie sauvegardée', { description: 'Les paramètres ont été mis à jour' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de sauvegarder' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWorkMethodology = async () => {
    if (!clientId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clients/${clientId}/work-methodology`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workMethodology),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthodologie de travail sauvegardée', { description: 'Les paramètres ont été mis à jour' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de sauvegarder' })
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
      toast.error('Type de fichier non supporté', { description: 'Seuls les fichiers PDF, DOCX et DOC sont acceptés' })
      return
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', { description: 'La taille maximale est de 10 MB' })
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
        toast.success('Document ajouté', { description: 'Le document a été téléchargé avec succès' })
        await fetchDocuments()
        // Réinitialiser l'input
        event.target.value = ''
      } else {
        throw new Error(data.error?.message || 'Erreur lors du téléchargement')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de télécharger le document' })
    } finally {
      setUploading(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté', { description: 'Seuls les fichiers PDF, DOCX et DOC sont acceptés' })
      return
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', { description: 'La taille maximale est de 10 MB' })
      return
    }

    try {
      setUploading(true)
      setIsExtractingTemp(true)

      // Uploader et extraire directement
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/company-profile/extract-temp', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        const { extractedInfo } = data.data

        // Remplir automatiquement les champs du profil
        setProfile((prev) => ({
          ...prev,
          companyName: extractedInfo.companyName || prev.companyName,
          description: extractedInfo.description || prev.description,
          activities: extractedInfo.activities || prev.activities,
          workforce: extractedInfo.workforce || prev.workforce,
          equipment: extractedInfo.equipment || prev.equipment,
          qualitySafety: extractedInfo.qualitySafety || prev.qualitySafety,
          references: extractedInfo.references || prev.references,
        }))

        // Remplir la méthodologie de travail si présente
        if (extractedInfo.workMethodology) {
          setWorkMethodology((prev) => ({
            ...prev,
            workMethodology: extractedInfo.workMethodology || prev.workMethodology,
          }))
        }

        // Remplir les consignes rédactionnelles si présentes
        if (extractedInfo.writingGuidelines) {
          setMethodology((prev) => ({
            ...prev,
            writingGuidelines: extractedInfo.writingGuidelines || prev.writingGuidelines,
          }))
        }

        setIsProfileDirty(true)
        toast.success('Extraction réussie !', { description: 'Les informations ont été pré-remplies. Vous pouvez les modifier avant de sauvegarder.' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'extraction')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible d\'extraire les informations' })
    } finally {
      setUploading(false)
      setIsExtractingTemp(false)
      setExtractingId(null)
    }
  }

  const handleAIExtractUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    event.target.value = ''

    await processFile(file)
  }

  const handleExtractCompanyInfo = async (documentId: string) => {
    try {
      setExtractingId(documentId)
      toast.info('Extraction en cours', { description: 'L\'IA analyse le document...' })

      const response = await fetch(`/api/methodology-documents/${documentId}/extract-company-info`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        const { extractedInfo } = data.data

        // Remplir automatiquement les champs du profil
        setProfile((prev) => ({
          ...prev,
          companyName: extractedInfo.companyName || prev.companyName,
          description: extractedInfo.description || prev.description,
          activities: extractedInfo.activities || prev.activities,
          workforce: extractedInfo.workforce || prev.workforce,
          equipment: extractedInfo.equipment || prev.equipment,
          qualitySafety: extractedInfo.qualitySafety || prev.qualitySafety,
          references: extractedInfo.references || prev.references,
        }))

        // Remplir la méthodologie de travail si présente
        if (extractedInfo.workMethodology) {
          setWorkMethodology((prev) => ({
            ...prev,
            workMethodology: extractedInfo.workMethodology || prev.workMethodology,
          }))
        }

        // Remplir les consignes rédactionnelles si présentes
        if (extractedInfo.writingGuidelines) {
          setMethodology((prev) => ({
            ...prev,
            writingGuidelines: extractedInfo.writingGuidelines || prev.writingGuidelines,
          }))
        }

        // Basculer vers l'onglet Profil
        setActiveTab('profile')

        setIsProfileDirty(true)
        toast.success('Extraction réussie', { description: 'Les informations ont été pré-remplies. Vous pouvez les modifier.' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'extraction')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible d\'extraire les informations' })
    } finally {
      setExtractingId(null)
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
        toast.success('Document supprimé', { description: 'Le document a été supprimé avec succès' })
        await fetchDocuments()
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de supprimer le document' })
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
          title="Profil client"
          subtitle="Chargement..."
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

  if (!clientId) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
        <ProjectHeader
          title="Profil client"
          subtitle="Aucun client associé à ce projet"
        />
        <div className="mt-2">
          <HeaderLinkButton
            href={`/projects/${projectId}`}
            icon={<ArrowLeft className="h-4 w-4" />}
            variant="ghost"
            size="sm"
          >
            Retour à l'Aperçu
          </HeaderLinkButton>
        </div>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <p className="text-sm text-orange-800">
              Ce projet n'a pas de client associé. Veuillez d'abord associer un client au projet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader
        title={clientName || 'Profil client'}
        subtitle="Personnalisez le profil et la méthodologie de ce client"
      />

      {/* Bouton retour */}
      <div className="mt-2">
        <HeaderLinkButton
          href={`/projects/${projectId}`}
          icon={<ArrowLeft className="h-4 w-4" />}
          variant="ghost"
          size="sm"
        >
          Retour à l'Aperçu
        </HeaderLinkButton>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" data-tutorial="company-profile">
        <TabsList className="grid w-full grid-cols-4" data-tutorial="company-tabs">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="work-methodology">Méthodologie travail</TabsTrigger>
          <TabsTrigger value="methodology">Méthodologie rédaction</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil */}
        <TabsContent value="profile" className="space-y-4">
          {/* Barre de progression extraction */}
          {isExtractingTemp && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-4">
                <ExtractionProgressBar isExtracting={isExtractingTemp} />
              </CardContent>
            </Card>
          )}

          {/* Carte d'extraction IA */}
          {!isExtractingTemp && (
            <Card className="border-blue-200 bg-blue-50/30" data-tutorial="company-ai-extract">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Colonne gauche : Texte explicatif */}
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Remplissage automatique avec l'IA
                      </h3>
                      <p className="text-xs text-blue-700">
                        Uploadez un document contenant des informations sur votre entreprise (plaquette commerciale, présentation, etc.) et l'IA remplira automatiquement les champs ci-dessous.
                      </p>
                    </div>
                  </div>

                  {/* Colonne droite : Zone drag & drop */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-100/50'
                        : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!uploading) {
                        document.getElementById('ai-extract-upload')?.click()
                      }
                    }}
                  >
                    <input
                      type="file"
                      id="ai-extract-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleAIExtractUpload}
                      disabled={uploading}
                      className="hidden"
                      aria-label="Uploader un document pour l'extraction automatique"
                    />
                    <div className="flex flex-col items-center gap-2 text-center">
                      {uploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                          <p className="text-sm font-medium text-blue-900">Upload...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Glissez ou cliquez
                            </p>
                            <p className="text-xs text-blue-600 mt-1">PDF, DOCX - Max 10 MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations du client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nom de l'entreprise */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Nom de l'entreprise
                </label>
                <Input
                  id="companyName"
                  value={profile.companyName || ''}
                  onChange={(e) => updateProfile({ companyName: e.target.value })}
                  placeholder="Ex: ACME Construction"
                  className="text-base font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={profile.description || ''}
                  onChange={(e) => {
                    updateProfile({ description: e.target.value })
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Presentation generale de l'entreprise..."
                  className="min-h-[80px] resize-none overflow-hidden"
                />
              </div>

              {/* Activites */}
              <div className="space-y-2">
                <label htmlFor="activities" className="text-sm font-medium">
                  Activites
                </label>
                <Textarea
                  id="activities"
                  value={profile.activities || ''}
                  onChange={(e) => {
                    updateProfile({ activities: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Liste des activites principales...&#10;- Activite 1&#10;- Activite 2"
                  className="min-h-[80px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              {/* Effectif */}
              <div className="space-y-2">
                <label htmlFor="workforce" className="text-sm font-medium">
                  Effectif
                </label>
                <Textarea
                  id="workforce"
                  value={profile.workforce || ''}
                  onChange={(e) => {
                    updateProfile({ workforce: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Ex: 50 salaries&#10;- 10 ingenieurs&#10;- 30 techniciens&#10;- 10 administratifs"
                  className="min-h-[60px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              {/* Equipements */}
              <div className="space-y-2">
                <label htmlFor="equipment" className="text-sm font-medium">
                  Equipements
                </label>
                <Textarea
                  id="equipment"
                  value={profile.equipment || ''}
                  onChange={(e) => {
                    updateProfile({ equipment: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Ex: Moyens materiels et techniques&#10;- 10 engins de chantier&#10;- 15 vehicules utilitaires"
                  className="min-h-[60px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              {/* Qualite & Securite */}
              <div className="space-y-2">
                <label htmlFor="qualitySafety" className="text-sm font-medium">
                  Qualite & Securite
                </label>
                <Textarea
                  id="qualitySafety"
                  value={profile.qualitySafety || ''}
                  onChange={(e) => {
                    updateProfile({ qualitySafety: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Certifications, normes, demarches qualite...&#10;- ISO 9001&#10;- Qualibat"
                  className="min-h-[80px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              {/* References */}
              <div className="space-y-2">
                <label htmlFor="references" className="text-sm font-medium">
                  References
                </label>
                <Textarea
                  id="references"
                  value={profile.references || ''}
                  onChange={(e) => {
                    updateProfile({ references: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Projets similaires realises...&#10;- Projet 1 (2023)&#10;- Projet 2 (2022)"
                  className="min-h-[80px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-2" data-tutorial="company-save-btn" data-profile-dirty={isProfileDirty}>
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

        {/* Tab 2: Méthodologie de travail */}
        <TabsContent value="work-methodology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Méthodologie de travail
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Décrivez votre organisation et vos méthodes d'intervention sur chantier.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="workMethodology" className="text-sm font-medium">
                  Méthodologie d'intervention
                </label>
                <Textarea
                  id="workMethodology"
                  value={workMethodology.workMethodology || ''}
                  onChange={(e) => {
                    setWorkMethodology({ ...workMethodology, workMethodology: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Décrivez votre méthodologie de travail :&#10;- Phase étude/validation (démarches admin, plans, PPSPS, commandes...)&#10;- Phase travaux (installation chantier, protections, étapes techniques...)&#10;- Phase réception (autocontrôle, OPR, levée réserves, DOE...)&#10;- Gestion OPR et SAV"
                  className="min-h-[200px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="siteOccupied" className="text-sm font-medium">
                  Organisation en site occupé
                </label>
                <Textarea
                  id="siteOccupied"
                  value={workMethodology.siteOccupied || ''}
                  onChange={(e) => {
                    setWorkMethodology({ ...workMethodology, siteOccupied: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Décrivez votre organisation pour les interventions en site occupé :&#10;- Mesures de protection des occupants&#10;- Gestion du bruit et des nuisances&#10;- Planning d'intervention adapté&#10;- Communication avec les usagers"
                  className="min-h-[120px] resize-none overflow-hidden whitespace-pre-wrap"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveWorkMethodology} disabled={saving} size="sm" className="gap-2">
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

        {/* Tab 3: Méthodologie rédactionnelle */}
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
                <Button onClick={handleSaveMethodology} disabled={saving} size="sm" className="gap-2">
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

        {/* Tab 4: Documents de référence */}
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
                </CardHeader>
                <CardContent className="space-y-3">
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
                    PDF, DOC, DOCX - Max 10 MB
                  </p>
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleExtractCompanyInfo(doc.id)}
                          disabled={extractingId === doc.id}
                        >
                          {extractingId === doc.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Extraction...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Extraire les infos
                            </>
                          )}
                        </Button>
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
