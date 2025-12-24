/**
 * Modal de choix quand le mémoire est désynchronisé du template
 * Propose : continuer avec l'existant ou créer une nouvelle version
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, GitBranch, ArrowRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface DesyncChoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  syncStatus: {
    templateQuestionsCount: number
    memoireSectionsCount: number
    orphanSections: number
  }
  currentVersion: number
  onContinue: () => void
  onCreateNewVersion: () => Promise<void>
}

export function DesyncChoiceModal({
  open,
  onOpenChange,
  syncStatus,
  currentVersion,
  onContinue,
  onCreateNewVersion,
}: DesyncChoiceModalProps) {
  const [loading, setLoading] = useState(false)

  const handleCreateNewVersion = async () => {
    try {
      setLoading(true)
      await onCreateNewVersion()
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    onContinue()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Questions modifiées</DialogTitle>
              <DialogDescription className="mt-1">
                Les questions du template ont été modifiées depuis la création de ce mémoire.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="text-sm text-muted-foreground space-y-1">
            {syncStatus.orphanSections > 0 && (
              <p>• {syncStatus.orphanSections} question(s) de ce mémoire n'existe(nt) plus dans le template</p>
            )}
            {syncStatus.templateQuestionsCount !== syncStatus.memoireSectionsCount && (
              <p>• Le template contient {syncStatus.templateQuestionsCount} questions, ce mémoire en a {syncStatus.memoireSectionsCount}</p>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-sm font-medium">Que souhaitez-vous faire ?</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Option 1: Continuer */}
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Continuer avec ce mémoire</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ignorer les différences et continuer à travailler sur V{currentVersion}.
                  Vos réponses existantes seront conservées.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Nouvelle version */}
          <button
            onClick={handleCreateNewVersion}
            disabled={loading}
            className="w-full text-left p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              {loading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5" />
              ) : (
                <GitBranch className="h-5 w-5 text-primary mt-0.5" />
              )}
              <div>
                <p className="font-medium text-primary">Créer une nouvelle version (V{currentVersion + 1})</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Figer V{currentVersion} et créer une V{currentVersion + 1} basée sur les nouvelles questions.
                  Les réponses existantes seront copiées et les nouvelles questions ajoutées.
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
