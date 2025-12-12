/**
 * Hook React pour gérer les documents
 */

import { useState } from 'react'
import { DocumentWithAnalysis } from '@/types/database'
import { ApiResponse, UploadResponse } from '@/types/api'

export function useDocuments(projectId?: string) {
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async (pid?: string) => {
    try {
      setLoading(true)
      const id = pid || projectId
      if (!id) {
        setError('Project ID is required')
        return
      }

      const response = await fetch(`/api/projects/${id}/documents`)
      const data: ApiResponse<DocumentWithAnalysis[]> = await response.json()

      if (data.success && data.data) {
        setDocuments(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (
    file: File,
    pid: string,
    documentType?: string
  ): Promise<UploadResponse> => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', pid)
      if (documentType) {
        formData.append('documentType', documentType)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse<UploadResponse> = await response.json()

      if (data.success && data.data) {
        // Refresh documents list
        await fetchDocuments(pid)
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to upload document')
      }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  const parseDocument = async (documentId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}/parse`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Refresh documents list
        if (projectId) {
          await fetchDocuments()
        }
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to parse document')
      }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    parseDocument,
  }
}

