/**
 * Hook React pour gérer les projets
 */

import { useState, useEffect } from 'react'
import { ProjectWithDocuments } from '@/types/database'
import { ApiResponse } from '@/types/api'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      const data: ApiResponse<ProjectWithDocuments[]> = await response.json()

      if (data.success && data.data) {
        setProjects(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch projects')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      const data: ApiResponse<ProjectWithDocuments> = await response.json()

      if (data.success && data.data) {
        setProjects([data.data, ...projects])
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to create project')
      }
    } catch (err) {
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
  }
}

