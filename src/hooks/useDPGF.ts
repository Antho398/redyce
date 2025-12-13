/**
 * Hook React pour gérer les DPGF
 */

import { useState } from 'react'
import { ApiResponse } from '@/types/api'
import { toastSuccess, toastError } from '@/lib/toast'

export interface DPGF {
  id: string
  title: string
  reference?: string
  status: string
  confidence?: number
  data: any
  createdAt: string
}

export function useDPGF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractDPGF = async (documentId: string, options?: {
    model?: string
    temperature?: number
  }): Promise<DPGF> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dpgf/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, ...options }),
      })

      const data: ApiResponse<DPGF> = await response.json()

      if (data.success && data.data) {
        toastSuccess('DPGF extrait avec succès', `Le DPGF "${data.data.title}" a été extrait.`)
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to extract DPGF')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toastError('Erreur lors de l\'extraction DPGF', errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProjectDPGFs = async (projectId: string): Promise<DPGF[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dpgf?projectId=${projectId}`)
      const data: ApiResponse<DPGF[]> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to fetch DPGFs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getDPGFById = async (dpgfId: string): Promise<DPGF> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dpgf/${dpgfId}`)
      const data: ApiResponse<DPGF> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to fetch DPGF')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateDPGF = async (
    dpgfId: string,
    updates: {
      title?: string
      reference?: string
      status?: string
    }
  ): Promise<DPGF> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dpgf/${dpgfId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data: ApiResponse<DPGF> = await response.json()

      if (data.success && data.data) {
        toastSuccess('DPGF mis à jour', 'Les modifications ont été enregistrées.')
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to update DPGF')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toastError('Erreur lors de la mise à jour', errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const validateDPGF = async (dpgfId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dpgf/${dpgfId}/validate`, {
        method: 'POST',
      })

      const data: ApiResponse<{
        valid: boolean
        errors: string[]
        warnings: string[]
      }> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to validate DPGF')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteDPGF = async (dpgfId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dpgf/${dpgfId}`, {
        method: 'DELETE',
      })

      const data: ApiResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete DPGF')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    extractDPGF,
    getProjectDPGFs,
    getDPGFById,
    updateDPGF,
    validateDPGF,
    deleteDPGF,
  }
}

