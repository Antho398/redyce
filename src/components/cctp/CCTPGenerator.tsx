/**
 * Composant de génération de CCTP
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Sparkles, Loader2, AlertCircle } from 'lucide-react'

interface CCTPGeneratorProps {
  projectId: string
  dpgfId?: string
  onGenerateComplete?: (cctpId: string) => void
}

export function CCTPGenerator({
  projectId,
  dpgfId,
  onGenerateComplete,
}: CCTPGeneratorProps) {
  const [userRequirements, setUserRequirements] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)

      const body: any = {}
      if (dpgfId) {
        body.dpgfId = dpgfId
        if (userRequirements) body.userRequirements = userRequirements
        if (additionalContext) body.additionalContext = additionalContext
      } else {
        body.projectId = projectId
        if (userRequirements) body.userRequirements = userRequirements
        if (additionalContext) body.additionalContext = additionalContext
      }

      const response = await fetch('/api/cctp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success && result.data) {
        if (onGenerateComplete) {
          onGenerateComplete(result.data.id)
        }
        // Réinitialiser le formulaire
        setUserRequirements('')
        setAdditionalContext('')
      } else {
        throw new Error(result.error?.message || 'Génération échouée')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Générer un CCTP
        </CardTitle>
        <CardDescription>
          {dpgfId
            ? 'Génère un CCTP depuis un DPGF structuré'
            : 'Génère un CCTP depuis les documents du projet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Exigences spécifiques (optionnel)
          </label>
            <Textarea
            value={userRequirements}
            onChange={(e) => setUserRequirements(e.target.value)}
            placeholder="Décrivez les exigences spécifiques pour ce projet..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Contexte supplémentaire (optionnel)
          </label>
            <Textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Ajoutez des informations contextuelles supplémentaires..."
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le CCTP
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          La génération peut prendre quelques instants selon la complexité du projet
        </p>
      </CardContent>
    </Card>
  )
}

