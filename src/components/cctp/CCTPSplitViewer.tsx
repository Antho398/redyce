/**
 * Composant de visualisation CCTP avec layout split (sommaire + contenu)
 * Design professionnel pour écrans métiers - Modern SaaS Redyce
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Download,
  RefreshCw,
  Save,
  Loader2,
  AlertCircle,
  FileText,
  Building2,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { toast } from 'sonner'

interface CCTPSplitViewerProps {
  cctpId: string
  projectName?: string
}

interface CCTPSection {
  id: string
  title: string
  content: string
  level: number
}

export function CCTPSplitViewer({ cctpId, projectName }: CCTPSplitViewerProps) {
  const [cctp, setCctp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCCTP()
  }, [cctpId])

  const fetchCCTP = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/cctp/${cctpId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setCctp(data.data)
        // Initialiser le contenu édité
        if (data.data.content) {
          setEditedContent({ [cctpId]: data.data.content })
        }
      } else {
        setError(data.error?.message || 'Erreur lors du chargement du CCTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Extraction des sections depuis le contenu
  const sections = useMemo<CCTPSection[]>(() => {
    if (!cctp?.content) return []

    const lines = cctp.content.split('\n')
    const extractedSections: CCTPSection[] = []
    let currentSection: CCTPSection | null = null

    lines.forEach((line: string, index: number) => {
      // Détection des titres (lignes commençant par #, 1., 1.1, etc.)
      const titleMatch = line.match(/^(#{1,6}|[\d\.]+)\s+(.+)$/)
      if (titleMatch) {
        // Sauvegarder la section précédente
        if (currentSection) {
          extractedSections.push(currentSection)
        }

        const level = titleMatch[1].startsWith('#')
          ? titleMatch[1].length
          : titleMatch[1].split('.').length

        currentSection = {
          id: `section-${extractedSections.length}`,
          title: titleMatch[2].trim(),
          content: '',
          level,
        }
      } else if (currentSection) {
        // Ajouter le contenu à la section courante
        currentSection.content += (currentSection.content ? '\n' : '') + line
      }
    })

    // Ajouter la dernière section
    if (currentSection) {
      extractedSections.push(currentSection)
    }

    // Si aucune section n'a été trouvée, créer une section par défaut
    if (extractedSections.length === 0 && cctp.content) {
      extractedSections.push({
        id: 'section-0',
        title: 'Contenu principal',
        content: cctp.content,
        level: 1,
      })
    }

    return extractedSections
  }, [cctp])

  // Sélectionner la première section par défaut quand les sections sont disponibles
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id)
    }
  }, [sections, selectedSectionId])

  const selectedSection = useMemo(() => {
    return sections.find((s) => s.id === selectedSectionId) || sections[0]
  }, [sections, selectedSectionId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implémenter la sauvegarde via API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Enregistré', 'Le CCTP a été sauvegardé avec succès')
      fetchCCTP()
    } catch (err) {
      toast.error('Erreur', 'Impossible de sauvegarder le CCTP')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      // TODO: Implémenter la régénération via API
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Régénéré', 'Le CCTP a été régénéré')
      fetchCCTP()
    } catch (err) {
      toast.error('Erreur', 'Impossible de régénérer le CCTP')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleExport = () => {
    if (!cctp?.content) return

    const blob = new Blob([editedContent[cctpId] || cctp.content], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cctp.title || 'CCTP'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Export réussi', 'Le CCTP a été exporté')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <FileText className="h-10 w-10 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du CCTP...</p>
        </div>
      </div>
    )
  }

  if (error || !cctp) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium mb-4">{error || 'CCTP non trouvé'}</p>
          <Button onClick={fetchCCTP} variant="outline" className="rounded-md">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {cctp.title || 'CCTP sans titre'}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {cctp.version && (
                  <span>
                    <strong className="text-foreground">Version:</strong> {cctp.version}
                  </span>
                )}
                {projectName && (
                  <span>
                    <strong className="text-foreground">Projet:</strong> {projectName}
                  </span>
                )}
                {cctp.status && (
                  <Badge
                    variant={cctp.status === 'finalized' ? 'default' : 'outline'}
                    className={cn(
                      'rounded-full',
                      cctp.status === 'finalized' && 'bg-green-600 hover:bg-green-700'
                    )}
                  >
                    {cctp.status === 'finalized' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Finalisé
                      </>
                    ) : (
                      'Brouillon'
                    )}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="rounded-xl"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRegenerating && 'animate-spin')}
                />
                Régénérer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl"
              >
                <Save className={cn('h-4 w-4 mr-2', isSaving && 'animate-pulse')} />
                Enregistrer
              </Button>
              <Button variant="default" size="sm" onClick={handleExport} className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Layout split : Sommaire + Contenu */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Panneau gauche : Sommaire */}
        <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card h-fit lg:sticky lg:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <ClipboardList className="h-5 w-5 text-foreground" />
              Sommaire
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              <nav className="space-y-1 p-4">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id)
                      // Scroll vers la section dans le contenu
                      const element = document.getElementById(`section-${section.id}`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200',
                      selectedSectionId === section.id
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      section.level > 1 && 'pl-6 text-xs'
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>

        {/* Panneau droit : Contenu */}
        <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-card">
          <CardContent className="p-6">
            {selectedSection ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {selectedSection.title}
                  </h2>
                  <Textarea
                    value={editedContent[selectedSection.id] || selectedSection.content}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        [selectedSection.id]: e.target.value,
                      })
                    }
                    className="min-h-[500px] font-mono text-sm resize-none"
                    placeholder="Contenu de la section..."
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Sélectionnez une section</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Encart contexte / Paramètres IA (optionnel) */}
      {cctp.dpgf && (
        <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] bg-accent/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-foreground" />
              Contexte et paramètres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {cctp.dpgf && (
                <div>
                  <strong className="text-foreground font-semibold">DPGF source:</strong>{' '}
                  <span className="text-muted-foreground">{cctp.dpgf.title || 'N/A'}</span>
                </div>
              )}
              {cctp.model && (
                <div>
                  <strong className="text-foreground font-semibold">Modèle IA:</strong>{' '}
                  <span className="text-muted-foreground">{cctp.model}</span>
                </div>
              )}
              {cctp.createdAt && (
                <div>
                  <strong className="text-foreground font-semibold">Date de création:</strong>{' '}
                  <span className="text-muted-foreground">
                    {new Date(cctp.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {cctp.updatedAt && (
                <div>
                  <strong className="text-foreground font-semibold">Dernière mise à jour:</strong>{' '}
                  <span className="text-muted-foreground">
                    {new Date(cctp.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

