/**
 * Page pour remplir le formulaire entreprise extrait du template
 * Affiche les champs détectés dans le template et permet de les remplir
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCompanyForm()
  }, [projectId])

  const fetchCompanyForm = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()

      if (data.success && data.data?.companyForm) {
        const formFields = data.data.companyForm.fields as FormField[]
        setFields(formFields)
        // Initialiser les valeurs vides
        const initialValues: Record<string, string> = {}
        formFields.forEach((field) => {
          initialValues[field.label] = field.value || ''
        })
        setValues(initialValues)
      } else {
        toast.error('Erreur', 'Aucun formulaire entreprise trouvé pour ce template')
        router.push(`/projects/${projectId}/documents`)
      }
    } catch (err) {
      toast.error('Erreur', 'Impossible de charger le formulaire')
      router.push(`/projects/${projectId}/documents`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/template-company-form/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Formulaire sauvegardé', 'Les informations ont été enregistrées')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du formulaire...</p>
        </div>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/projects/${projectId}/questions`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun formulaire entreprise détecté dans ce template.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/projects/${projectId}/questions`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux questions
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire entreprise</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Informations extraites du template mémoire. Ces données seront utilisées lors de la génération du mémoire.
          </p>
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

          <div className="flex justify-end gap-2 pt-4">
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
        </CardContent>
      </Card>
    </div>
  )
}

