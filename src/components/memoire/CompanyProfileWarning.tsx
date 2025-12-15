/**
 * Composant d'avertissement si le profil entreprise est vide
 * Affiche un warning non bloquant
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Settings } from 'lucide-react'
import Link from 'next/link'

export function CompanyProfileWarning() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    try {
      const response = await fetch('/api/company-profile')
      const data = await response.json()
      setHasProfile(data.success && data.data && data.data.companyName)
    } catch (err) {
      console.error('Error checking profile:', err)
      setHasProfile(null)
    }
  }

  if (hasProfile === null || hasProfile) {
    return null
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">
              Profil entreprise non complété
            </p>
            <p className="text-sm text-amber-800 mb-3">
              Les réponses générées par l'IA seront génériques. Complétez votre profil entreprise
              pour des réponses personnalisées.
            </p>
            <Link href="/settings/company-profile">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Compléter le profil entreprise
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

