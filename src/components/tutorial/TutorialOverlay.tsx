/**
 * Composant principal du tutoriel
 * Affiche soit le Tooltip soit le Spotlight selon les préférences utilisateur
 */

'use client'

import { useTutorial } from '@/contexts/TutorialContext'
import { TutorialTooltip } from './TutorialTooltip'
import { TutorialSpotlight } from './TutorialSpotlight'

export function TutorialOverlay() {
  const { style, enabled, isLoading } = useTutorial()

  // Ne rien afficher pendant le chargement ou si désactivé
  if (isLoading || !enabled) {
    return null
  }

  // Afficher le composant selon le style choisi
  if (style === 'spotlight') {
    return <TutorialSpotlight />
  }

  return <TutorialTooltip />
}
