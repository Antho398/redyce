/**
 * Page de gestion des DPGF d'un projet
 * Utilise l'architecture générique LivrablePage
 */

'use client'

import { LivrablePage } from '@/components/livrables/LivrablePage'
import { LivrableType, DocumentSource, LivrableData } from '@/types/livrables'
import { ApiResponse } from '@/types/api'
import { toast } from 'sonner'

export default function ProjectDPGFPage({
  params,
}: {
  params: { id: string }
}) {
  const projectId = params.id

  // Récupérer les documents du projet
  const fetchDocuments = async (pid: string): Promise<DocumentSource[]> => {
    const response = await fetch(`/api/projects/${pid}/documents`)
    const data: ApiResponse<any[]> = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Erreur lors de la récupération des documents')
    }

    return data.data.map((doc) => ({
      id: doc.id,
      name: doc.name || doc.fileName,
      fileName: doc.fileName,
      status: doc.status,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
    }))
  }

  // Récupérer les DPGF du projet
  const fetchLivrables = async (pid: string): Promise<LivrableData[]> => {
    const response = await fetch(`/api/dpgf?projectId=${pid}`)
    const data: ApiResponse<any[]> = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Erreur lors de la récupération des DPGF')
    }

    return data.data.map((dpgf) => ({
      id: dpgf.id,
      title: dpgf.title,
      reference: dpgf.reference,
      status: dpgf.status,
      createdAt: dpgf.createdAt,
      updatedAt: dpgf.updatedAt,
      ...dpgf,
    }))
  }

  // Générer/Extraire un DPGF depuis un document
  const handleGenerate = async (options?: {
    userRequirements?: string
    additionalContext?: string
  }): Promise<LivrableData> => {
    // Pour DPGF, on doit extraire depuis un document
    // Sélectionner le premier document analysé disponible
    const documents = await fetchDocuments(projectId)
    const analyzedDocuments = documents.filter((d) => d.status === 'processed')

    if (analyzedDocuments.length === 0) {
      throw new Error('Aucun document analysé disponible. Analysez d\'abord vos documents.')
    }

    // Utiliser le premier document analysé
    const documentId = analyzedDocuments[0].id

    const response = await fetch('/api/dpgf/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    })

    const data: ApiResponse<any> = await response.json()

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Erreur lors de l\'extraction du DPGF')
    }

    toast.success('DPGF extrait avec succès', {
      description: `Le DPGF "${data.data.title}" a été extrait.`,
    })

    return {
      id: data.data.id,
      title: data.data.title,
      reference: data.data.reference,
      status: data.data.status,
      createdAt: data.data.createdAt,
      updatedAt: data.data.updatedAt,
      ...data.data,
    }
  }

  // Valider un DPGF
  const handleValidate = async (id: string): Promise<void> => {
    const response = await fetch(`/api/dpgf/${id}/validate`, {
      method: 'POST',
    })

    const data: ApiResponse<any> = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || 'Erreur lors de la validation')
    }

    toast.success('DPGF validé', {
      description: 'Le DPGF a été validé avec succès.',
    })
  }

  // Exporter un DPGF (à implémenter selon les besoins)
  const handleExport = async (id: string): Promise<void> => {
    // TODO: Implémenter l'export DPGF
    toast.info('Export en cours de développement')
  }

  return (
    <LivrablePage
      livrableType={LivrableType.DPGF}
      projectId={projectId}
      onGenerate={handleGenerate}
      onFetchLivrables={fetchLivrables}
      onFetchDocuments={fetchDocuments}
      onValidate={handleValidate}
      onExport={handleExport}
    />
  )
}
