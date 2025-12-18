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
    // Rediriger vers le profil entreprise par défaut
    router.replace('/settings/company-profile')
  }, [router])

  return null
}
