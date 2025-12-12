/**
 * Hook React pour gérer les CCTP
 */

import { useState } from 'react'
import { ApiResponse } from '@/types/api'

export interface CCTP {
  id: string
  title: string
  reference?: string
  content: string
  structure: any
  status: string
  version: number
  createdAt: string
}

export function useCCTP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFromDPGF = async (
    dpgfId: string,
    options?: {
      userRequirements?: string
      additionalContext?: string
      model?: string
      temperature?: number
    }
  ): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cctp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dpgfId, ...options }),
      })

      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to generate CCTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateFromDocuments = async (
    projectId: string,
    options?: {
      userRequirements?: string
      additionalContext?: string
      model?: string
      temperature?: number
    }
  ): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cctp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...options }),
      })

      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to generate CCTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProjectCCTPs = async (projectId: string): Promise<CCTP[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp?projectId=${projectId}`)
      const data: ApiResponse<CCTP[]> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to fetch CCTPs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getCCTPById = async (cctpId: string): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp/${cctpId}`)
      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to fetch CCTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCCTP = async (
    cctpId: string,
    updates: {
      title?: string
      reference?: string
      content?: string
      status?: string
    }
  ): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp/${cctpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to update CCTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const finalizeCCTP = async (cctpId: string): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp/${cctpId}/finalize`, {
        method: 'POST',
      })

      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to finalize CCTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createNewVersion = async (cctpId: string): Promise<CCTP> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp/${cctpId}/version`, {
        method: 'POST',
      })

      const data: ApiResponse<CCTP> = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to create new version')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCCTP = async (cctpId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cctp/${cctpId}`, {
        method: 'DELETE',
      })

      const data: ApiResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete CCTP')
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
    generateFromDPGF,
    generateFromDocuments,
    getProjectCCTPs,
    getCCTPById,
    updateCCTP,
    finalizeCCTP,
    createNewVersion,
    deleteCCTP,
  }
}

