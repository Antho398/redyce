/**
 * Page de gestion du profil entreprise
 * Profil global transversal à tous les projets
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import Link from 'next/link'

interface CompanyProfile {
  id: string
  companyName: string
  description?: string
  activities?: string
  workforce?: string
  equipment?: string
  qualitySafety?: string
  references?: string
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    companyName: '',
    description: '',
    activities: '',
    workforce: '',
    equipment: '',
    qualitySafety: '',
    references: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company-profile')
      const data: ApiResponse<CompanyProfile | null> = await response.json()

      if (data.success && data.data) {
        setProfile({
          companyName: data.data.companyName || '',
          description: data.data.description || '',
          activities: data.data.activities || '',
          workforce: data.data.workforce || '',
          equipment: data.data.equipment || '',
          qualitySafety: data.data.qualitySafety || '',
          references: data.data.references || '',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile.companyName || profile.companyName.trim().length === 0) {
      toast.error('Le nom de l\'entreprise est requis')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data: ApiResponse<CompanyProfile> = await response.json()

      if (data.success) {
        toast.success('Profil entreprise enregistré', 'Ces informations seront utilisées pour générer vos mémoires techniques')
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <ProjectHeader
        title="Profil entreprise"
        subtitle="Ces informations seront utilisées pour générer vos mémoires techniques"
      />

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Profil global</p>
              <p>
                Ce profil est transversal à tous vos projets. Il représente l'ADN réel de votre entreprise
                et sera automatiquement utilisé comme contexte dans la génération de vos mémoires techniques.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations entreprise</CardTitle>
          <CardDescription>
            Complétez les informations sur votre entreprise pour améliorer la qualité des mémoires générés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">
                Nom de l'entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                placeholder="Nom de votre entreprise"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description / Présentation générale</Label>
              <Textarea
                id="description"
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Présentez votre entreprise, son histoire, ses valeurs..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="activities">Activités / Corps d'état / Spécialités</Label>
              <Textarea
                id="activities"
                value={profile.activities || ''}
                onChange={(e) => setProfile({ ...profile, activities: e.target.value })}
                placeholder="Listez vos domaines d'activité, corps d'état, spécialités..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="workforce">Effectifs</Label>
              <Textarea
                id="workforce"
                value={profile.workforce || ''}
                onChange={(e) => setProfile({ ...profile, workforce: e.target.value })}
                placeholder="Effectifs globaux ou par métier..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="equipment">Moyens matériels</Label>
              <Textarea
                id="equipment"
                value={profile.equipment || ''}
                onChange={(e) => setProfile({ ...profile, equipment: e.target.value })}
                placeholder="Parc matériel, équipements, moyens techniques..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="qualitySafety">Qualité / Sécurité / Environnement</Label>
              <Textarea
                id="qualitySafety"
                value={profile.qualitySafety || ''}
                onChange={(e) => setProfile({ ...profile, qualitySafety: e.target.value })}
                placeholder="Certifications, démarches qualité, sécurité, environnement..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="references">Références chantiers</Label>
              <Textarea
                id="references"
                value={profile.references || ''}
                onChange={(e) => setProfile({ ...profile, references: e.target.value })}
                placeholder="Références de chantiers remarquables, projets phares..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving}>
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
          </form>
        </CardContent>
      </Card>
    </>
  )
}

