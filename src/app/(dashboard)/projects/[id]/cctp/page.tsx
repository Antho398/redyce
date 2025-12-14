/**
 * Page de génération et gestion des CCTP d'un projet
 * Utilise l'architecture générique LivrablePage
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LivrablePage } from '@/components/livrables/LivrablePage'
import { LivrableType, DocumentSource, LivrableData } from '@/types/livrables'
import { ApiResponse } from '@/types/api'
import { toast } from 'sonner'

export default function ProjectCCTPPage({
  params,
}: {
  params: { id: string }
}) {
  const projectId = params.id
  const searchParams = useSearchParams()
  const [selectedDpgfId, setSelectedDpgfId] = useState<string | null>(
    searchParams.get('dpgfId')
  )

  // Charger le DPGF si spécifié dans l'URL
  useEffect(() => {
    const dpgfId = searchParams.get('dpgfId')
    if (dpgfId) {
      setSelectedDpgfId(dpgfId)
    } else {
      // Sinon, chercher un DPGF validé
      fetchDPGFs()
    }
  }, [searchParams])

  const fetchDPGFs = async () => {
    try {
      const response = await fetch(`/api/dpgf?projectId=${projectId}`)
      const data: ApiResponse<any[]> = await response.json()
      
      if (data.success && data.data && data.data.length > 0) {
        const validated = data.data.find((d: any) => d.status === 'validated')
        if (validated) {
          setSelectedDpgfId(validated.id)
        }
      }
    } catch (error) {
      console.error('Error fetching DPGFs:', error)
    }
  }

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

  // Récupérer les CCTP du projet
  const fetchLivrables = async (pid: string): Promise<LivrableData[]> => {
    const response = await fetch(`/api/cctp?projectId=${pid}`)
    const data: ApiResponse<any[]> = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Erreur lors de la récupération des CCTP')
    }

    return data.data.map((cctp) => ({
      id: cctp.id,
      title: cctp.title,
      reference: cctp.reference,
      status: cctp.status,
      version: cctp.version,
      createdAt: cctp.createdAt,
      updatedAt: cctp.updatedAt,
      ...cctp,
    }))
  }

  // Générer un CCTP
  const handleGenerate = async (options?: {
    userRequirements?: string
    additionalContext?: string
  }): Promise<LivrableData> => {
    const body: any = {}

    // Si un DPGF est disponible, l'utiliser
    if (selectedDpgfId) {
      body.dpgfId = selectedDpgfId
    } else {
      // Sinon, générer depuis les documents du projet
      body.projectId = projectId
    }

    if (options?.userRequirements) {
      body.userRequirements = options.userRequirements
    }
    if (options?.additionalContext) {
      body.additionalContext = options.additionalContext
    }

    const response = await fetch('/api/cctp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data: ApiResponse<any> = await response.json()

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Erreur lors de la génération du CCTP')
    }

    toast.success('CCTP généré avec succès', {
      description: `Le CCTP "${data.data.title}" a été généré.`,
    })

    return {
      id: data.data.id,
      title: data.data.title,
      reference: data.data.reference,
      status: data.data.status,
      version: data.data.version,
      createdAt: data.data.createdAt,
      updatedAt: data.data.updatedAt,
      ...data.data,
    }
  }

  // Finaliser un CCTP
  const handleFinalize = async (id: string): Promise<void> => {
    const response = await fetch(`/api/cctp/${id}/finalize`, {
      method: 'POST',
    })

    const data: ApiResponse<any> = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || 'Erreur lors de la finalisation')
    }

    toast.success('CCTP finalisé', {
      description: 'Le CCTP a été finalisé avec succès.',
    })
  }

  // Exporter un CCTP (à implémenter selon les besoins)
  const handleExport = async (id: string): Promise<void> => {
    // TODO: Implémenter l'export CCTP
    toast.info('Export en cours de développement')
  }

  return (
    <LivrablePage
      livrableType={LivrableType.CCTP}
      projectId={projectId}
      onGenerate={handleGenerate}
      onFetchLivrables={fetchLivrables}
      onFetchDocuments={fetchDocuments}
      onFinalize={handleFinalize}
      onExport={handleExport}
      selectedDpgfId={selectedDpgfId}
    />
  )
}
