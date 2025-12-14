/**
 * Composant de visualisation d'un CCTP généré
 * Design premium pour professionnels du bâtiment
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  FileText,
  Download,
  Edit,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Tag,
  FileCheck,
  Award,
  Building2,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { motion, AnimatePresence } from 'framer-motion'

interface CCTPViewerProps {
  cctpId: string
  onEdit?: () => void
}

export function CCTPViewer({ cctpId, onEdit }: CCTPViewerProps) {
  const [cctp, setCctp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'text' | 'structure'>('structure')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projet: true,
    sections: true,
    prescriptions: true,
    reception: true,
  })

  useEffect(() => {
    fetchCCTP()
  }, [cctpId])

  const fetchCCTP = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cctp/${cctpId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setCctp(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch CCTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleFinalize = async () => {
    try {
      const response = await fetch(`/api/cctp/${cctpId}/finalize`, {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        setCctp(result.data)
      }
    } catch (err) {
      console.error('Error finalizing CCTP:', err)
    }
  }

  const handleDownload = () => {
    if (!cctp?.content) return

    const blob = new Blob([cctp.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cctp.title || 'CCTP'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Chargement du CCTP...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !cctp) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
          <p className="text-sm text-destructive font-medium">{error || 'CCTP not found'}</p>
        </CardContent>
      </Card>
    )
  }

  const structure = cctp.structure as any

  return (
    <div className="space-y-6">
      {/* Header avec actions flottantes */}
      <Card className="relative">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{cctp.title}</h1>
                <Badge
                  variant={cctp.status === 'finalized' ? 'accent' : 'secondary'}
                  className="gap-1"
                >
                  {cctp.status === 'finalized' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Finalisé
                    </>
                  ) : (
                    'Généré'
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  Version {cctp.version}
                </span>
                {cctp.reference && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    {cctp.reference}
                  </span>
                )}
                {cctp.dpgf && (
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4" />
                    Depuis DPGF: {cctp.dpgf.title}
                  </span>
                )}
              </div>
            </div>
            {/* Actions flottantes */}
            <div className="flex gap-2 shrink-0 flex-wrap">
              <div className="flex gap-2 border-r border-border pr-2">
                <Button
                  variant={viewMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('text')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Texte
                </Button>
                <Button
                  variant={viewMode === 'structure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('structure')}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Structure
                </Button>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
                {cctp.status !== 'finalized' && (
                  <Button size="sm" onClick={handleFinalize}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finaliser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scroll container */}
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {viewMode === 'text' ? (
          <Card>
            <CardHeader>
              <CardTitle>Contenu du CCTP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-accent/30 p-6 rounded-lg border border-border">
                  {cctp.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Projet - Section collapsible */}
            {structure?.projet && (
              <Card>
                <Collapsible
                  open={expandedSections.projet}
                  onOpenChange={() => toggleSection('projet')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                          Informations Projet
                        </CardTitle>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-transform',
                            expandedSections.projet && 'rotate-180'
                          )}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Nom</p>
                          <p className="text-sm text-foreground font-medium">{structure.projet.nom}</p>
                        </div>
                        {structure.projet.reference && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Référence
                            </p>
                            <p className="text-sm text-foreground font-medium">
                              {structure.projet.reference}
                            </p>
                          </div>
                        )}
                        {structure.projet.lieu && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Lieu</p>
                            <p className="text-sm text-foreground font-medium">
                              {structure.projet.lieu}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Sections - Section collapsible */}
            {structure?.sections && structure.sections.length > 0 && (
              <Card>
                <Collapsible
                  open={expandedSections.sections}
                  onOpenChange={() => toggleSection('sections')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-primary" />
                          Sections ({structure.sections.length})
                        </CardTitle>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-transform',
                            expandedSections.sections && 'rotate-180'
                          )}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {structure.sections.map((section: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-l-4 border-primary pl-4 py-3 rounded-r-lg bg-accent/20"
                          >
                            <h4 className="font-semibold text-foreground mb-2">{section.titre}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {section.contenu}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Prescriptions Techniques - Section collapsible avec tableau */}
            {structure?.prescriptionsTechniques &&
              structure.prescriptionsTechniques.length > 0 && (
                <Card>
                  <Collapsible
                    open={expandedSections.prescriptions}
                    onOpenChange={() => toggleSection('prescriptions')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Prescriptions Techniques ({structure.prescriptionsTechniques.length})
                          </CardTitle>
                          <ChevronDown
                            className={cn(
                              'h-5 w-5 text-muted-foreground transition-transform',
                              expandedSections.prescriptions && 'rotate-180'
                            )}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left p-3 text-sm font-semibold text-foreground">
                                  Article
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-foreground">
                                  Titre
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-foreground">
                                  Description
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-foreground">
                                  Normes
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {structure.prescriptionsTechniques.map(
                                (presc: any, index: number) => (
                                  <motion.tr
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-border hover:bg-accent/30 transition-colors"
                                  >
                                    <td className="p-3">
                                      <Badge variant="outline" className="text-xs">
                                        {presc.article}
                                      </Badge>
                                    </td>
                                    <td className="p-3 text-sm font-medium text-foreground">
                                      {presc.titre}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                      <p className="line-clamp-2">{presc.description}</p>
                                      {presc.exigences && presc.exigences.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {presc.exigences.map((ex: string, exIndex: number) => (
                                            <div
                                              key={exIndex}
                                              className="text-xs flex items-start gap-2"
                                            >
                                              <span className="text-primary mt-0.5">•</span>
                                              <span>{ex}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {presc.normes && presc.normes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {presc.normes.map((norme: string, nIndex: number) => (
                                            <Badge
                                              key={nIndex}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {norme}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </motion.tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}

            {/* Réception - Section collapsible */}
            {structure?.reception && (
              <Card>
                <Collapsible
                  open={expandedSections.reception}
                  onOpenChange={() => toggleSection('reception')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          Réception des Travaux
                        </CardTitle>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-transform',
                            expandedSections.reception && 'rotate-180'
                          )}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {structure.reception.conditions && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Conditions</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {structure.reception.conditions}
                          </p>
                        </div>
                      )}
                      {structure.reception.documents && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Documents</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {structure.reception.documents}
                          </p>
                        </div>
                      )}
                      {structure.reception.essais && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Essais</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {structure.reception.essais}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
