/**
 * Hook pour gérer le template mémoire d'un projet
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  status: string
  metaJson?: {
    nbSections?: number
  }
}

interface UseTemplateResult {
  template: Template | null
  loading: boolean
  projectNotFound: boolean
  fetchTemplate: () => Promise<void>
}

export function useTemplate(projectId: string): UseTemplateResult {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectNotFound, setProjectNotFound] = useState(false)

  const fetchTemplate = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setProjectNotFound(false)
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()
      
      // Projet non trouvé : rediriger vers la liste des projets
      if (response.status === 404 || (data.error?.message && data.error.message.includes('not found'))) {
        setProjectNotFound(true)
        router.replace('/projects')
        return
      }
      
      if (data.success) {
        setTemplate(data.data)
      } else {
        setTemplate(null)
      }
    } catch (err) {
      setTemplate(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  return { template, loading, projectNotFound, fetchTemplate }
}

