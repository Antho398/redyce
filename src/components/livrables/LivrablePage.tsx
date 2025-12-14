/**
 * Composant générique pour les pages de livrables
 * Gère tous les états et orchestre les sections (Sources, Génération, Résultat)
 * Architecture scalable pour DPGF, CCTP et futurs livrables
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  LivrableType,
  LivrableConfig,
  LivrableStatus,
  DocumentSource,
  LivrableData,
} from '@/types/livrables'
import { getLivrableConfig } from '@/config/livrables-config'
import { LivrableSourcesSection } from './LivrableSourcesSection'
import { LivrableGenerationSection } from './LivrableGenerationSection'
import { LivrableResultSection } from './LivrableResultSection'

interface LivrablePageProps {
  livrableType: LivrableType
  projectId: string
  config?: Partial<LivrableConfig>
  onGenerate: (options?: { userRequirements?: string; additionalContext?: string }) => Promise<LivrableData>
  onFetchLivrables: (projectId: string) => Promise<LivrableData[]>
  onFetchDocuments: (projectId: string) => Promise<DocumentSource[]>
  renderCustomViewer?: (livrable: LivrableData) => React.ReactNode
  onValidate?: (id: string) => Promise<void>
  onFinalize?: (id: string) => Promise<void>
  onExport?: (id: string) => Promise<void>
  onDownload?: (id: string) => Promise<void>
  selectedDpgfId?: string | null
}

export function LivrablePage({
  livrableType,
  projectId,
  config: customConfig,
  onGenerate,
  onFetchLivrables,
  onFetchDocuments,
  renderCustomViewer,
  onValidate,
  onFinalize,
  onExport,
  onDownload,
  selectedDpgfId,
}: LivrablePageProps) {
  const router = useRouter()
  const livrableConfig = getLivrableConfig(livrableType)
  const Icon = livrableConfig.icon

  const [project, setProject] = useState<any>(null)
  const [documents, setDocuments] = useState<DocumentSource[]>([])
  const [livrables, setLivrables] = useState<LivrableData[]>([])
  const [selectedLivrableId, setSelectedLivrableId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcul du statut basé sur les données
  const status: LivrableStatus = useMemo(() => {
    if (generating) return 'generating'
    if (error) return 'error'
    if (documents.length === 0) return 'no_documents'
    
    const hasAnalyzed = documents.some((d) => d.status === 'processed')
    const hasProcessing = documents.some((d) => d.status === 'processing')
    
    if (hasProcessing && !hasAnalyzed) return 'documents_not_analyzed'
    if (!hasAnalyzed) return 'no_documents'
    if (livrables.length === 0) return 'ready_to_generate'
    return 'generated'
  }, [documents, livrables, generating, error])

  // Chargement initial
  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger le projet
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectRes.json()
      if (projectData.success) {
        setProject(projectData.data)
      }

      // Charger les documents
      const docs = await onFetchDocuments(projectId)
      setDocuments(docs)

      // Charger les livrables
      const livs = await onFetchLivrables(projectId)
      setLivrables(livs)
      if (livs.length > 0 && !selectedLivrableId) {
        setSelectedLivrableId(livs[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (options?: { userRequirements?: string; additionalContext?: string }) => {
    try {
      setGenerating(true)
      setError(null)
      const newLivrable = await onGenerate(options)
      await fetchData()
      setSelectedLivrableId(newLivrable.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const handleValidate = async (id: string) => {
    if (!onValidate) return
    try {
      await onValidate(id)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation')
    }
  }

  const handleFinalize = async (id: string) => {
    if (!onFinalize) return
    try {
      await onFinalize(id)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la finalisation')
    }
  }

  const handleExport = async (id: string) => {
    if (!onExport) return
    try {
      await onExport(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export')
    }
  }

  const handleDownload = async (id: string) => {
    if (!onDownload) return
    try {
      await onDownload(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const hasAnalyzedDocuments = documents.some((d) => d.status === 'processed')

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-6">
      {/* Header compact */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {livrableConfig.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {livrableConfig.description}
      </p>

      {/* Sections */}
      <div className="space-y-4">
        {/* Section Sources */}
        <LivrableSourcesSection
          documents={documents}
          loading={false}
          projectId={projectId}
        />

        {/* Section Génération */}
        <LivrableGenerationSection
          livrableType={livrableType}
          status={status}
          projectId={projectId}
          dpgfId={selectedDpgfId}
          hasAnalyzedDocuments={hasAnalyzedDocuments}
          onGenerate={handleGenerate}
          generating={generating}
          error={error}
        />

        {/* Section Résultat (si généré) */}
        {livrables.length > 0 && (
          <LivrableResultSection
            livrableType={livrableType}
            livrables={livrables}
            selectedLivrableId={selectedLivrableId}
            projectName={project?.name}
            onSelectLivrable={setSelectedLivrableId}
            onRefresh={fetchData}
            onDownload={onDownload ? handleDownload : undefined}
            onExport={onExport ? handleExport : undefined}
            onValidate={onValidate ? handleValidate : undefined}
            onFinalize={onFinalize ? handleFinalize : undefined}
          />
        )}
      </div>
    </div>
  )
}

