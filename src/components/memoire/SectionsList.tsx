/**
 * Liste des sections du mémoire (colonne gauche)
 * Avec recherche, statuts, indicateurs
 */

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  CheckCircle2,
  Circle,
  FileText,
  AlertCircle,
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
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  DRAFT: { label: 'À rédiger', variant: 'outline', color: 'text-muted-foreground' },
  IN_PROGRESS: { label: 'En cours', variant: 'secondary', color: 'text-blue-700' },
  COMPLETED: { label: 'Relu', variant: 'default', color: 'text-green-700' },
  REVIEWED: { label: 'Relu', variant: 'default', color: 'text-green-700' },
}

export function SectionsList({ sections, selectedSectionId, onSelectSection }: SectionsListProps) {
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
    <div className="w-80 border-r bg-muted/30 flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-background">
        <h2 className="text-sm font-semibold mb-3">Sections</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Aucune section trouvée' : 'Aucune section'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSections.map((section) => {
              const isSelected = section.id === selectedSectionId
              const hasContent = section.content && section.content.trim().length > 0
              const sourcesAvailable = hasSources(section)

              return (
                <button
                  key={section.id}
                  onClick={() => onSelectSection(section.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-background border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(section)}
                        <span className="text-xs font-medium text-muted-foreground">
                          {section.order}.
                        </span>
                        <span className="text-sm font-medium truncate">
                          {section.title}
                        </span>
                      </div>
                      {section.question && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {section.question}
                        </p>
                      )}
                      {!sourcesAvailable && hasContent && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Sources manquantes</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(section.status)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

