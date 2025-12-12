/**
 * Hook React pour les interactions avec l'IA
 */

import { useState } from 'react'
import { ApiResponse } from '@/types/api'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeDocument = async (
    documentId: string,
    analysisType: string = 'full'
  ) => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, analysisType }),
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to analyze document')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateMemory = async (
    memoryId: string,
    userRequirements?: string
  ) => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, userRequirements }),
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to generate memory')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const chat = async (message: string, projectId?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, projectId }),
      })

      const data: ApiResponse<{ message: string }> = await response.json()

      if (data.success && data.data) {
        return data.data.message
      } else {
        throw new Error(data.error?.message || 'Failed to get chat response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    analyzeDocument,
    generateMemory,
    chat,
  }
}

