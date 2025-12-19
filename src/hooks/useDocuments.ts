/**
 * Hook pour gérer les documents d'un projet
 */

import { useState, useEffect } from 'react'
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
}

export function useDocuments(projectId: string): UseDocumentsResult {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectNotFound, setProjectNotFound] = useState(false)

  const fetchDocuments = async () => {
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
  }

  useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return { documents, loading, error, projectNotFound, fetchDocuments }
}
