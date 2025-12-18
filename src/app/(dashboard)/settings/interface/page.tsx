/**
 * Page de paramètres d'interface
 * Permet de configurer le mode sombre/clair/système
 */

'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Moon, Sun, Monitor, Check } from 'lucide-react'

export default function InterfaceSettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const getThemeIcon = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      return <Monitor className="h-4 w-4" />
    }
    return themeValue === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )
  }

  const getThemeLabel = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      return 'Système'
    }
    return themeValue === 'dark' ? 'Sombre' : 'Clair'
  }

  const getThemeDescription = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      return `Suit le thème de votre système (actuellement ${resolvedTheme === 'dark' ? 'sombre' : 'clair'})`
    }
    return themeValue === 'dark' ? 'Réduit la fatigue visuelle' : 'Mode clair par défaut'
  }

  return (
    <>
      {/* Header - pleine largeur */}
      <div className="w-full mb-4">
        <ProjectHeader
          title="Interface"
          subtitle="Personnalisez l&apos;apparence de l&apos;application"
        />
      </div>
      
      {/* Contenu avec max-width */}
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apparence</CardTitle>
            <CardDescription>
              Choisissez le thème de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
              <div className="space-y-3">
                {(['light', 'dark', 'system'] as const).map((themeValue) => (
                  <div 
                    key={themeValue} 
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                      theme === themeValue ? 'bg-accent/50 border border-accent' : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={themeValue} id={themeValue} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={themeValue}
                        className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-accent-foreground">
                          {getThemeIcon(themeValue)}
                        </div>
                        <span className="flex items-center gap-2">
                          {getThemeLabel(themeValue)}
                          {theme === themeValue && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <Check className="h-3 w-3" />
                              Appliqué
                            </span>
                          )}
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-10">
                        {getThemeDescription(themeValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

