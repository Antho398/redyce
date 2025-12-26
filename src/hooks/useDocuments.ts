/**
 * Hook pour gérer les documents d'un projet
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType?: string
  status: string
  createdAt: string
}

interface UseDocumentsResult {
  documents: Document[]
  loading: boolean
  error: string | null
  projectNotFound: boolean
  fetchDocuments: () => Promise<void>
  updateDocumentType: (documentId: string, newType: string) => void
}

export function useDocuments(projectId: string): UseDocumentsResult {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectNotFound, setProjectNotFound] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      setProjectNotFound(false)
      const response = await fetch(`/api/projects/${projectId}/documents`)
      const data = await response.json()

      // Projet non trouvé : rediriger vers la liste des projets
      if (response.status === 404 || (data.error?.message && data.error.message.includes('not found'))) {
        setProjectNotFound(true)
        router.replace('/projects')
        return
      }

      if (data.success && data.data) {
        setDocuments(data.data)
      } else {
        setError(data.error?.message || 'Erreur lors du chargement des documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Mise à jour locale du type de document (évite un rechargement complet)
  const updateDocumentType = useCallback((documentId: string, newType: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId ? { ...doc, documentType: newType } : doc
      )
    )
  }, [])

  return { documents, loading, error, projectNotFound, fetchDocuments, updateDocumentType }
}
