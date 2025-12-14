/**
 * Section Génération - Gère la génération d'un livrable
 * Composant réutilisable pour tous les types de livrables
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { LivrableStatus, LivrableType } from '@/types/livrables'
import { toast } from 'sonner'

interface LivrableGenerationSectionProps {
  livrableType: LivrableType
  status: LivrableStatus
  projectId: string
  dpgfId?: string
  hasAnalyzedDocuments: boolean
  onGenerate: (options?: { userRequirements?: string; additionalContext?: string }) => Promise<void>
  onGenerateComplete?: (livrableId: string) => void
  generating?: boolean
  error?: string | null
}

export function LivrableGenerationSection({
  livrableType,
  status,
  projectId,
  dpgfId,
  hasAnalyzedDocuments,
  onGenerate,
  onGenerateComplete,
  generating = false,
  error = null,
}: LivrableGenerationSectionProps) {
  const [userRequirements, setUserRequirements] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setLocalError(null)
      await onGenerate({
        userRequirements: userRequirements || undefined,
        additionalContext: additionalContext || undefined,
      })
      setUserRequirements('')
      setAdditionalContext('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération'
      setLocalError(message)
      toast.error(message)
    }
  }

  // État: Aucun document source
  if (status === 'no_documents') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez des documents au projet pour pouvoir générer ce livrable.
            </p>
            <Button
              size="sm"
              onClick={() => window.location.href = `/projects/${projectId}/documents`}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Ajouter des documents
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État: Documents non analysés
  if (status === 'documents_not_analyzed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Des documents sont présents mais doivent être analysés.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Une fois l'analyse terminée, la génération sera disponible.
            </p>
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyse en cours
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État: En cours de génération
  if (status === 'generating' || generating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Génération en cours...</p>
            <p className="text-xs text-muted-foreground">
              Cela peut prendre quelques minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État: Erreur
  if (status === 'error' || error || localError) {
    const errorMessage = error || localError || 'Une erreur est survenue'
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive mb-2">Erreur de génération</p>
            <p className="text-xs text-muted-foreground mb-4">{errorMessage}</p>
            <Button size="sm" onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État: Prêt à générer
  if (status === 'ready_to_generate') {
    const requiresDPGF = livrableType === LivrableType.CCTP && !dpgfId
    const canGenerate = hasAnalyzedDocuments && !requiresDPGF

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canGenerate && requiresDPGF && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800 mb-2">
                Un DPGF validé est requis pour générer ce CCTP.
              </p>
              <p className="text-xs text-yellow-700">
                Extrayez d'abord un DPGF depuis vos documents, puis validez-le.
              </p>
            </div>
          )}

          {canGenerate && (
            <>
              {livrableType === LivrableType.CCTP && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Exigences spécifiques (optionnel)
                    </label>
                    <Textarea
                      value={userRequirements}
                      onChange={(e) => setUserRequirements(e.target.value)}
                      placeholder="Décrivez vos exigences spécifiques pour ce CCTP..."
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Contexte additionnel (optionnel)
                    </label>
                    <Textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Ajoutez tout contexte utile pour la génération..."
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {livrableType === LivrableType.DPGF && (
                <div className="text-sm text-muted-foreground">
                  L'extraction DPGF utilisera automatiquement le premier document analysé disponible.
                </div>
              )}

              <Button
                onClick={handleGenerate}
                size="sm"
                className="w-full gap-2"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {livrableType === LivrableType.DPGF ? 'Extraction en cours...' : 'Génération en cours...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {livrableType === LivrableType.DPGF ? `Extraire un ${livrableType}` : `Générer le ${livrableType}`}
                  </>
                )}
              </Button>
            </>
          )}

          {!canGenerate && !requiresDPGF && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                En attente de documents analysés.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // État: Déjà généré (bouton régénérer si nécessaire)
  if (status === 'generated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium">Livrable généré avec succès</p>
          </div>
          {livrableType === LivrableType.CCTP && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="w-full gap-2"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Régénération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Régénérer
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

