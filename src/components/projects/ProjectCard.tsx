/**
 * Carte projet compacte - Design Linear/Notion/Figma
 * Élégant, minimaliste, dense et efficace - Hauteur max ~160-180px
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FolderOpen,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    createdAt: string
    updatedAt?: string
    _count?: {
      documents: number
      memories: number
    }
    documents?: any[]
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const documentCount = project._count?.documents || project.documents?.length || 0
  const memoryCount = project._count?.memoires || 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Aujourd'hui"
    if (diffDays === 2) return "Hier"
    if (diffDays <= 7) return `Il y a ${diffDays}j`
    
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getProjectType = (name: string, description?: string): string => {
    const text = `${name} ${description || ''}`.toLowerCase()
    if (text.includes('rénovation') || text.includes('renovation')) return 'Rénovation'
    if (text.includes('construction')) return 'Construction'
    if (text.includes('aménagement') || text.includes('amenagement')) return 'Aménagement'
    return 'Projet'
  }

  const projectType = getProjectType(project.name, project.description)

  return (
    <Card className="group relative transition-all duration-200 hover:shadow-sm hover:border-[#151959]/20 border-border/50 rounded-xl bg-white">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start gap-3">
          {/* Icône compacte */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-8 w-8 rounded-lg bg-[#f8f9fd] flex items-center justify-center border border-border/50">
              <FolderOpen className="h-4 w-4 text-[#64748b]" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            {/* Titre + Badge */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium text-[#151959] truncate">
                {project.name}
              </h3>
              <Badge 
                variant="secondary" 
                className="shrink-0 rounded-full bg-[#f8f9fd] text-[#64748b] border-border/50 text-xs px-2 py-0.5"
              >
                {projectType}
              </Badge>
            </div>
            
            {/* Description */}
            {project.description && (
              <p className="text-sm text-[#64748b] line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Stats ligne compacte */}
        <div className="flex items-center gap-3 text-xs text-[#64748b]">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-medium text-[#151959]">{documentCount}</span>
            <span>Docs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium text-[#151959]">{memoryCount}</span>
            <span>Mémoires</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.updatedAt || project.createdAt)}</span>
          </div>
        </div>

        {/* Actions compactes */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 rounded-xl text-xs"
            asChild
          >
            <Link href={`/projects/${project.id}`}>
              Voir
            </Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 rounded-xl text-xs"
            asChild
          >
            <Link href={`/projects/${project.id}/memoire`}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Mémoire
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
