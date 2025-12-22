/**
 * Page de création d'un nouveau client
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHeader } from '@/components/projects/ProjectHeader'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    description: '',
    activities: '',
    workforce: '',
    equipment: '',
    qualitySafety: '',
    references: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom du client est requis')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Client créé avec succès')
        router.push(`/clients/${data.data.id}`)
      } else {
        toast.error(data.error?.message || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3 py-4 px-4">
      <ProjectHeader
        title="Nouveau client"
        subtitle="Créez un profil pour votre entreprise cliente"
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

      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Informations du client</h2>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du client */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du client <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Entreprise ABC"
                required
              />
              <p className="text-xs text-muted-foreground">
                Nom d'affichage pour identifier ce client
              </p>
            </div>

            {/* Raison sociale */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Raison sociale</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Ex: ABC SAS"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brève description de l'entreprise cliente"
                rows={3}
              />
            </div>

            {/* Activités */}
            <div className="space-y-2">
              <Label htmlFor="activities">Activités principales</Label>
              <Textarea
                id="activities"
                value={formData.activities}
                onChange={(e) => handleChange('activities', e.target.value)}
                placeholder="Décrivez les activités principales de l'entreprise"
                rows={3}
              />
            </div>

            {/* Main d'œuvre */}
            <div className="space-y-2">
              <Label htmlFor="workforce">Main d'œuvre et compétences</Label>
              <Textarea
                id="workforce"
                value={formData.workforce}
                onChange={(e) => handleChange('workforce', e.target.value)}
                placeholder="Effectif, compétences, qualifications..."
                rows={3}
              />
            </div>

            {/* Matériel */}
            <div className="space-y-2">
              <Label htmlFor="equipment">Matériel et équipements</Label>
              <Textarea
                id="equipment"
                value={formData.equipment}
                onChange={(e) => handleChange('equipment', e.target.value)}
                placeholder="Matériel technique, parc machines, équipements..."
                rows={3}
              />
            </div>

            {/* Qualité/Sécurité */}
            <div className="space-y-2">
              <Label htmlFor="qualitySafety">Qualité et sécurité</Label>
              <Textarea
                id="qualitySafety"
                value={formData.qualitySafety}
                onChange={(e) => handleChange('qualitySafety', e.target.value)}
                placeholder="Certifications, normes, démarches qualité..."
                rows={3}
              />
            </div>

            {/* Références */}
            <div className="space-y-2">
              <Label htmlFor="references">Références clients</Label>
              <Textarea
                id="references"
                value={formData.references}
                onChange={(e) => handleChange('references', e.target.value)}
                placeholder="Projets antérieurs, références marquantes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le client'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/clients')}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
