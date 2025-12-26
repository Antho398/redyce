/**
 * Page principale des paramètres
 * Liste les différentes sections de paramètres
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers le premier onglet (tutoriel)
    router.replace('/settings/tutorial')
  }, [router])

  return null
}
