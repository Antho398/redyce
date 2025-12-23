/**
 * Page pour remplir les informations de l'entreprise extraites du template
 * Affiche les champs détectés dans le template et permet de les remplir
 * Ces données sont réutilisables entre plusieurs mémoires d'un même projet
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Sparkles, Paperclip, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { HeaderLinkButton } from '@/components/navigation/HeaderLinkButton'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { CompanyDocsUpload, type CompanyDoc } from '@/components/company/CompanyDocsUpload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FormField {
  label: string
  type: 'text' | 'date' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
  value?: string
}

export default function CompanyFormPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [fields, setFields] = useState<FormField[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [companyPresentation, setCompanyPresentation] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPresentation, setPendingPresentation] = useState<string>('')
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [companyDocs, setCompanyDocs] = useState<CompanyDoc[]>([])

  const fetchCompanyDocs = async () => {
    try {
      const response = await fetch(`/api/company-docs/${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setCompanyDocs(data.data)
      }
    } catch (error) {
      console.error('Error fetching company docs:', error)
    }
  }

  const fetchCompanyForm = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()

      if (data.success && data.data?.companyForm) {
        const allFields = data.data.companyForm.fields as any[]
        
        // Filtrer les champs pour exclure companyPresentation (qui sera géré séparément)
        const formFields = allFields.filter((f: any) => f.label !== 'companyPresentation' && f.key !== 'companyPresentation') as FormField[]
        setFields(formFields)
        
        // Initialiser les valeurs vides
        const initialValues: Record<string, string> = {}
        formFields.forEach((field) => {
          initialValues[field.label] = field.value || ''
        })
        setValues(initialValues)
        
        // Récupérer la présentation de l'entreprise si elle existe dans les fields
        const presentationField = allFields.find((f: any) => f.label === 'companyPresentation' || f.key === 'companyPresentation')
        if (presentationField?.value) {
          setCompanyPresentation(presentationField.value)
        }
      } else {
        toast.error('Erreur', { description: "Aucune information de l'entreprise trouvée pour ce template" })
        router.push(`/projects/${projectId}/documents`)
      }
    } catch (err) {
      toast.error('Erreur', { description: 'Impossible de charger les informations de l\'entreprise' })
      router.push(`/projects/${projectId}/documents`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyForm()
    fetchCompanyDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleGeneratePresentation = async () => {
    try {
      setGenerating(true)
      const response = await fetch(`/api/template-company-form/${projectId}/generate-presentation`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success && data.data?.presentation) {
        const newPresentation = data.data.presentation
        
        // Si du contenu existe déjà, demander confirmation via modal
        if (companyPresentation.trim()) {
          setPendingPresentation(newPresentation)
          setShowConfirmDialog(true)
        } else {
          setCompanyPresentation(newPresentation)
          toast.success('Proposition générée', { description: 'Le texte peut être modifié avant sauvegarde' })
        }
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la génération')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de générer la proposition' })
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirmReplace = () => {
    setCompanyPresentation(pendingPresentation)
    setShowConfirmDialog(false)
    setPendingPresentation('')
    toast.success('Proposition générée', { description: 'Le texte peut être modifié avant sauvegarde' })
  }

  const handleCancelReplace = () => {
    setShowConfirmDialog(false)
    setPendingPresentation('')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Préparer les valeurs avec la présentation de l'entreprise
      const valuesWithPresentation = {
        ...values,
        companyPresentation: companyPresentation,
      }
      
      const response = await fetch(`/api/template-company-form/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: valuesWithPresentation }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Informations sauvegardées', { description: 'Les informations ont été enregistrées' })
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de sauvegarder' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des informations...</p>
        </div>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
        <ProjectHeader title="Informations de l'entreprise" />
        <div className="mb-4">
          <HeaderLinkButton
            href={`/projects/${projectId}/questions`}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Retour
          </HeaderLinkButton>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune information de l'entreprise détectée dans ce template.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      {/* Header avec gradient */}
      <ProjectHeader title="Informations de l'entreprise" />

      {/* Bouton retour - sous le header */}
      <div className="mb-4">
        <HeaderLinkButton
          href={`/projects/${projectId}/questions`}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Retour aux questions
        </HeaderLinkButton>
      </div>

      {/* Section 1 : Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Informations utilisées dans l'en-tête et l'introduction du mémoire. Réutilisées pour tous les mémoires du projet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, idx) => (
            <div key={idx}>
              <Label htmlFor={`field-${idx}`}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === 'date' ? (
                <Input
                  id={`field-${idx}`}
                  type="date"
                  value={values[field.label] || ''}
                  onChange={(e) => setValues({ ...values, [field.label]: e.target.value })}
                  className="mt-1"
                  required={field.required}
                />
              ) : field.type === 'select' && field.options ? (
                <select
                  id={`field-${idx}`}
                  value={values[field.label] || ''}
                  onChange={(e) => setValues({ ...values, [field.label]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required={field.required}
                >
                  <option value="">Sélectionner...</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`field-${idx}`}
                  type="text"
                  value={values[field.label] || ''}
                  onChange={(e) => setValues({ ...values, [field.label]: e.target.value })}
                  className="mt-1"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 2 : Présentation de l'entreprise */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Présentation de l'entreprise</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDocsModal(true)}
                className="flex-shrink-0"
              >
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                Ajouter des documents
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePresentation}
                disabled={generating}
                className="flex-shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Générer une proposition (IA)
                  </>
                )}
              </Button>
            </div>
          </div>
          {/* Ligne compacte si des documents existent */}
          {companyDocs.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{companyDocs.length} document{companyDocs.length > 1 ? 's' : ''} ajouté{companyDocs.length > 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => setShowDocsModal(true)}
                className="text-primary hover:underline"
              >
                Gérer
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              Contenu généré à titre de suggestion et entièrement modifiable
            </p>
          </div>
          <Textarea
            value={companyPresentation}
            onChange={(e) => setCompanyPresentation(e.target.value)}
            placeholder="Présentez votre entreprise (activité, expertise, zone d'intervention…). Ces informations seront intégrées dans le mémoire technique."
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      {/* Modal de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remplacer le contenu existant ?</DialogTitle>
            <DialogDescription>
              Le texte actuel sera remplacé par la proposition générée. Souhaitez-vous continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReplace}>
              Annuler
            </Button>
            <Button onClick={handleConfirmReplace}>
              Remplacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal documents entreprise */}
      <Dialog open={showDocsModal} onOpenChange={setShowDocsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents entreprise</DialogTitle>
            <DialogDescription>
              Ajoutez une plaquette, présentation, ancien mémoire, etc. Ces documents servent uniquement à aider la génération.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CompanyDocsUpload 
              projectId={projectId} 
              compact={true}
              onDocsChange={(docs) => setCompanyDocs(docs)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocsModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/questions`)}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
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
    </div>
  )
}
