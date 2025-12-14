/**
 * Hook pour gérer le template mémoire d'un projet
 */

import { useState, useEffect } from 'react'

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
  fetchTemplate: () => Promise<void>
}

export function useTemplate(projectId: string): UseTemplateResult {
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/memoire/template?projectId=${projectId}`)
      const data = await response.json()
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
  }

  useEffect(() => {
    fetchTemplate()
  }, [projectId])

  return { template, loading, fetchTemplate }
}

