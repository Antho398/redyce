/**
 * Hook React pour gérer les mémoires techniques
 */

import { useState, useEffect, useCallback } from 'react'
import { ApiResponse } from '@/types/api'

export interface TechnicalMemo {
  id: string
  projectId: string
  userId: string
  title: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'EXPORTED'
  templateDocumentId: string
  contentJson?: any
  contentText?: string
  version: number
  metadata?: any
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
  template: {
    id: string
    name: string
    fileName?: string
  }
}

export interface UseMemosFilters {
  projectId?: string
  status?: 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'EXPORTED'
  search?: string
}

export function useMemos(filters?: UseMemosFilters) {
  const [memos, setMemos] = useState<TechnicalMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.projectId) params.set('projectId', filters.projectId)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('q', filters.search)

      const response = await fetch(`/api/memos?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message || 
          `Erreur ${response.status}: ${response.statusText}` ||
          'Erreur lors du chargement des mémoires'
        )
      }

      const data: ApiResponse<TechnicalMemo[]> = await response.json()

      if (data.success && data.data) {
        setMemos(data.data)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement des mémoires')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      console.error('Error fetching memos:', err)
    } finally {
      setLoading(false)
    }
  }, [filters?.projectId, filters?.status, filters?.search])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  const createMemo = useCallback(
    async (data: { projectId: string; templateDocumentId: string; title: string }) => {
      try {
        const response = await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result: ApiResponse<TechnicalMemo> = await response.json()

        if (result.success && result.data) {
          await fetchMemos() // Recharger la liste
          return result.data
        } else {
          throw new Error(result.error?.message || 'Erreur lors de la création')
        }
      } catch (err) {
        throw err
      }
    },
    [fetchMemos]
  )

  const updateMemo = useCallback(
    async (memoId: string, data: Partial<TechnicalMemo>) => {
      try {
        const response = await fetch(`/api/memos/${memoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result: ApiResponse<TechnicalMemo> = await response.json()

        if (result.success && result.data) {
          await fetchMemos() // Recharger la liste
          return result.data
        } else {
          throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
        }
      } catch (err) {
        throw err
      }
    },
    [fetchMemos]
  )

  const generateMemo = useCallback(
    async (memoId: string) => {
      try {
        const response = await fetch(`/api/memos/${memoId}/generate`, {
          method: 'POST',
        })

        const result: ApiResponse<TechnicalMemo> = await response.json()

        if (result.success && result.data) {
          await fetchMemos() // Recharger la liste
          return result.data
        } else {
          throw new Error(result.error?.message || 'Erreur lors de la génération')
        }
      } catch (err) {
        throw err
      }
    },
    [fetchMemos]
  )

  const exportMemo = useCallback(
    async (memoId: string, format: 'DOCX' | 'PDF' = 'DOCX') => {
      try {
        const response = await fetch(`/api/memos/${memoId}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format }),
        })

        const result: ApiResponse<any> = await response.json()

        if (result.success) {
          return result.data
        } else {
          throw new Error(result.error?.message || 'Erreur lors de l\'export')
        }
      } catch (err) {
        throw err
      }
    },
    []
  )

  return {
    memos,
    loading,
    error,
    refetch: fetchMemos,
    createMemo,
    updateMemo,
    generateMemo,
    exportMemo,
  }
}

