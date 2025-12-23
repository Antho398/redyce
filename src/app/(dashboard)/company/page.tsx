/**
 * Page du profil global de l'entreprise (société prestataire)
 * Informations communes à tous les projets
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Building2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'

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
}

export default function GlobalCompanyPage() {
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
      const data = await response.json()

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
      toast.error('Erreur', { description: 'Impossible de charger le profil de l\'entreprise' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profil sauvegardé', { description: 'Le profil de l\'entreprise a été mis à jour' })
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
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          title="Profil de l'entreprise"
          description="Informations globales de votre société"
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <PageHeader
        title="Profil de l'entreprise"
        description="Informations globales de votre société utilisées dans tous vos projets"
      />

      <Card className="mt-6">
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
            <Button onClick={handleSave} disabled={saving} className="gap-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
