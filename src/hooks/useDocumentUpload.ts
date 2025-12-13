/**
 * Hook React pour l'upload de documents
 */

import { useState } from 'react'
import { ApiResponse, UploadResponse } from '@/types/api'
import { toastSuccess, toastError } from '@/lib/toast'

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function useDocumentUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({})

  const uploadDocument = async (
    file: File,
    projectId: string,
    documentType?: string
  ): Promise<UploadResponse> => {
    const fileId = `${file.name}-${Date.now()}`

    try {
      setLoading(true)
      setError(null)

      setProgress((prev) => ({
        ...prev,
        [fileId]: {
          file,
          progress: 0,
          status: 'uploading',
        },
      }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      if (documentType) {
        formData.append('documentType', documentType)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse<UploadResponse> = await response.json()

      if (data.success && data.data) {
        setProgress((prev) => ({
          ...prev,
          [fileId]: {
            file,
            progress: 100,
            status: 'success',
          },
        }))

        toastSuccess('Document uploadé avec succès', `Le fichier "${file.name}" a été uploadé.`)
        return data.data
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)

      setProgress((prev) => ({
        ...prev,
        [fileId]: {
          file,
          progress: 0,
          status: 'error',
          error: errorMessage,
        },
      }))

      toastError('Erreur lors de l\'upload', errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const uploadMultiple = async (
    files: File[],
    projectId: string,
    documentType?: string
  ): Promise<UploadResponse[]> => {
    const results: UploadResponse[] = []

    for (const file of files) {
      try {
        const result = await uploadDocument(file, projectId, documentType)
        results.push(result)
      } catch (err) {
        // Continue avec les autres fichiers même en cas d'erreur
        console.error(`Failed to upload ${file.name}:`, err)
      }
    }

    return results
  }

  const clearProgress = (fileId?: string) => {
    if (fileId) {
      setProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })
    } else {
      setProgress({})
    }
  }

  return {
    loading,
    error,
    progress,
    uploadDocument,
    uploadMultiple,
    clearProgress,
  }
}

