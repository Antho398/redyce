/**
 * Liste des sections du mémoire (colonne gauche)
 * Avec recherche, statuts, indicateurs
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  CheckCircle2,
  Circle,
  FileText,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Loader2,
  Pause,
  Play,
  Square,
} from 'lucide-react'

export interface MemoireSection {
  id: string
  title: string
  order: number
  question?: string
  status: string
  content?: string
}

interface SectionsListProps {
  sections: MemoireSection[]
  selectedSectionId: string | null
  onSelectSection: (sectionId: string) => void
  onOpenComments?: (sectionId: string) => void
  sectionsCommentsCount?: Record<string, number>
  onGenerateAll?: () => void
  isGeneratingAll?: boolean
  generatingIndex?: number
  isFrozen?: boolean
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'outline', color: 'text-muted-foreground' },
  IN_PROGRESS: { label: 'À relire', variant: 'secondary', color: 'text-blue-700' },
  REVIEWED: { label: 'Relu', variant: 'default', color: 'text-green-700' },
  VALIDATED: { label: 'Validé', variant: 'default', color: 'text-green-800' },
  // Legacy: COMPLETED est traité comme REVIEWED
  COMPLETED: { label: 'Relu', variant: 'default', color: 'text-green-700' },
}

export function SectionsList({
  sections,
  selectedSectionId,
  onSelectSection,
  onOpenComments,
  sectionsCommentsCount = {},
  onGenerateAll,
  isGeneratingAll = false,
  generatingIndex,
  isFrozen = false,
  isPaused = false,
  onPause,
  onResume,
  onStop,
}: SectionsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSections = sections.filter((section) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      section.title.toLowerCase().includes(query) ||
      section.question?.toLowerCase().includes(query) ||
      section.content?.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.DRAFT
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    )
  }

  const getStatusIcon = (section: MemoireSection) => {
    if (section.status === 'COMPLETED' || section.status === 'REVIEWED') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (section.content && section.content.trim().length > 0) {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />
  }

  const hasSources = (section: MemoireSection) => {
    // V1 simple : si la section a du contenu, on considère qu'elle peut avoir des sources
    // Plus tard : vérifier les MemoireSourceLink
    return section.content && section.content.trim().length > 50
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Card className="m-4 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">QUESTIONS</h2>
            {onGenerateAll && !isFrozen && (
              <Button
                size="sm"
                onClick={onGenerateAll}
                disabled={isGeneratingAll || sections.length === 0}
                className="text-xs gap-1.5 h-7"
                title="Génère les réponses pour toutes les questions vides ou en brouillon"
              >
                {isGeneratingAll ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {generatingIndex !== undefined ? `${generatingIndex + 1}/${sections.length}` : 'Génération...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Générer tout
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          {isGeneratingAll && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-blue-700 font-medium">
                  {isPaused ? 'En pause' : 'Génération en cours...'}
                </p>
                <div className="flex items-center gap-1">
                  {isPaused ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onResume}
                      className="h-6 w-6 p-0"
                      title="Reprendre"
                    >
                      <Play className="h-3 w-3 text-blue-700" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onPause}
                      className="h-6 w-6 p-0"
                      title="Pause"
                    >
                      <Pause className="h-3 w-3 text-blue-700" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onStop}
                    className="h-6 w-6 p-0"
                    title="Arrêter"
                  >
                    <Square className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-600">
                {generatingIndex !== undefined ? `Question ${generatingIndex + 1}/${sections.length}` : 'Préparation...'} — Vous pouvez modifier les réponses déjà générées.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Aucune section trouvée' : 'Aucune section'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSections.map((section, index) => {
                const isSelected = section.id === selectedSectionId
                const hasContent = section.content && section.content.trim().length > 0
                const sourcesAvailable = hasSources(section)
                const isCurrentlyGenerating = isGeneratingAll && generatingIndex === index

                return (
                  <div
                    key={section.id}
                    className={`w-full p-3 rounded-md border transition-colors cursor-pointer ${
                      isCurrentlyGenerating
                        ? 'bg-blue-100 border-blue-300 animate-pulse'
                        : isSelected
                          ? 'bg-accent border-primary/30'
                          : 'bg-muted/30 border-border hover:bg-accent/50'
                    }`}
                    onClick={() => onSelectSection(section.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="opacity-60">
                            {isCurrentlyGenerating ? (
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            ) : (
                              getStatusIcon(section)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-medium text-muted-foreground/60">
                                {section.order}.
                              </span>
                            </div>
                            {section.question && (
                              <p className="text-sm font-medium text-foreground leading-relaxed">
                                {section.question}
                              </p>
                            )}
                            {!section.question && (
                              <p className="text-sm font-medium text-foreground">
                                {section.title}
                              </p>
                            )}
                            {!sourcesAvailable && hasContent && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>Sources manquantes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 opacity-75">
                        {getStatusBadge(section.status)}
                      </div>
                    </div>
                    {onOpenComments && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenComments(section.id)
                        }}
                        className="mt-2 ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                        title="Ouvrir les commentaires"
                      >
                        <MessageSquare className={`h-3 w-3 ${sectionsCommentsCount[section.id] > 0 ? 'text-[#F8D347] fill-[#F8D347]' : ''}`} />
                        <span>Commentaires{sectionsCommentsCount[section.id] > 0 ? ` (${sectionsCommentsCount[section.id]})` : ''}</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

