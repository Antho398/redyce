/**
 * Page de paramètres du tutoriel
 * Permet de gérer le mode tutoriel, choisir le style, et relancer le tutoriel
 */

'use client'

import { useTutorial } from '@/contexts/TutorialContext'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  MessageSquare,
  Lightbulb,
  RotateCcw,
  Play,
  CheckCircle2,
  Circle,
  Info,
} from 'lucide-react'
import { TUTORIAL_STEPS, getNextGlobalStep } from '@/lib/tutorial/steps'

export default function TutorialSettingsPage() {
  const {
    enabled,
    style,
    progress,
    completedSteps,
    setEnabled,
    setStyle,
    resetTutorial,
    isLoading,
  } = useTutorial()

  // Grouper les étapes par page pour l'affichage
  const stepsByPage = TUTORIAL_STEPS.reduce((acc, step) => {
    const pageName = getPageDisplayName(step.page)
    if (!acc[pageName]) {
      acc[pageName] = []
    }
    acc[pageName].push(step)
    return acc
  }, {} as Record<string, typeof TUTORIAL_STEPS>)

  function getPageDisplayName(page: string): string {
    const pageNames: Record<string, string> = {
      '/dashboard': 'Tableau de bord',
      '/clients/new': 'Création client',
      '/clients/[id]/projects': 'Projets du client',
      '/projects/[id]/documents': 'Documents',
      '/projects/[id]/questions': 'Questions',
      '/projects/[id]/memoire': 'Mémoire technique',
      '/projects/[id]/exports': 'Exports',
    }
    return pageNames[page] || page
  }

  return (
    <>
      {/* Header */}
      <ProjectHeader
        title="Tutoriel"
        subtitle="Gérez le guide interactif pour découvrir Redyce"
        dataTutorial="tutorial-toggle"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Carte principale - Activation */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Mode tutoriel</CardTitle>
                  <CardDescription>
                    Activez pour afficher les conseils sur chaque page
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isLoading}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Barre de progression globale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression globale</span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.completed} étape{progress.completed > 1 ? 's' : ''} complétée{progress.completed > 1 ? 's' : ''} sur {progress.total}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carte - Style d'affichage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Style d'affichage</CardTitle>
            <CardDescription>
              Choisissez comment les conseils apparaissent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={style}
              onValueChange={(value) => setStyle(value as 'tooltip' | 'spotlight')}
              disabled={isLoading}
              className="space-y-3"
            >
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  style === 'tooltip'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setStyle('tooltip')}
              >
                <RadioGroupItem value="tooltip" id="tooltip" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="tooltip" className="flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">Tooltip</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bulles discrètes à côté des éléments, style Notion
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  style === 'spotlight'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setStyle('spotlight')}
              >
                <RadioGroupItem value="spotlight" id="spotlight" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="spotlight" className="flex items-center gap-2 cursor-pointer">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium">Spotlight</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Overlay sombre avec mise en lumière de l'élément
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Carte - Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>
              Gérez votre progression dans le tutoriel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start"
              onClick={async () => {
                // Attendre que le tutoriel soit activé et persisté
                await setEnabled(true)
                // Naviguer vers la page de la prochaine étape non complétée
                const nextStep = getNextGlobalStep(completedSteps)
                if (nextStep) {
                  // Pour les pages avec [id], on ne peut pas naviguer directement
                  // car on n'a pas le projectId ici. Rediriger vers dashboard pour les premières étapes
                  // ou vers la liste des projets pour les étapes projet
                  if (nextStep.page.includes('[id]')) {
                    // L'utilisateur devra sélectionner un projet
                    window.location.href = '/dashboard'
                  } else {
                    window.location.href = nextStep.page
                  }
                } else {
                  window.location.href = '/dashboard'
                }
              }}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              {progress.completed === 0 ? 'Démarrer le tutoriel' : 'Reprendre le tutoriel'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={resetTutorial}
              disabled={isLoading || progress.completed === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recommencer depuis le début
            </Button>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Le tutoriel vous guide à travers les principales fonctionnalités de Redyce.
                Vous pouvez le désactiver à tout moment et le reprendre plus tard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carte - Détail des étapes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Détail des étapes</CardTitle>
            <CardDescription>
              Visualisez votre progression par section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stepsByPage).map(([pageName, steps]) => {
                const completedInPage = steps.filter(s => completedSteps.includes(s.id)).length
                const totalInPage = steps.length
                const isPageComplete = completedInPage === totalInPage

                return (
                  <div key={pageName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPageComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{pageName}</span>
                      </div>
                      <Badge
                        variant={isPageComplete ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {completedInPage} / {totalInPage}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1">
                      {steps.map((step) => {
                        const isCompleted = completedSteps.includes(step.id)
                        return (
                          <div
                            key={step.id}
                            className={`flex items-center gap-2 text-xs py-1 ${
                              isCompleted ? 'text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                            <span className={isCompleted ? 'line-through' : ''}>
                              {step.title}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
