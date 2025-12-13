/**
 * Composant de visualisation d'un DPGF structuré
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
  Package,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Tag,
  FileCheck,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { motion, AnimatePresence } from 'framer-motion'

interface DPGFData {
  titre: string
  reference?: string
  dateCreation?: string
  articles: Array<{
    numero: string
    titre?: string
    prescriptions: string[]
    materiaux?: Array<{
      designation: string
      caracteristiques: Record<string, any>
    }>
  }>
  materiauxGeneraux?: Array<{
    designation: string
    caracteristiques: Record<string, any>
    notes?: string
  }>
  normes?: string[]
  observations?: string
}

interface DPGFViewerProps {
  dpgfId: string
}

export function DPGFViewer({ dpgfId }: DPGFViewerProps) {
  const [dpgf, setDpgf] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    articles: true,
    materiaux: true,
    normes: true,
  })

  useEffect(() => {
    fetchDPGF()
  }, [dpgfId])

  const fetchDPGF = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dpgf/${dpgfId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setDpgf(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch DPGF')
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

  const handleExport = () => {
    // TODO: Implémenter l'export
    console.log('Export DPGF', dpgfId)
  }

  const handleValidate = async () => {
    // TODO: Implémenter la validation
    console.log('Validate DPGF', dpgfId)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Chargement du DPGF...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !dpgf) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-sm text-destructive font-medium">{error || 'DPGF not found'}</p>
        </CardContent>
      </Card>
    )
  }

  const data = dpgf.data as DPGFData

  return (
    <div className="space-y-6">
      {/* Header avec actions flottantes */}
      <Card className="relative">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{data.titre || dpgf.title}</h1>
                <Badge
                  variant={dpgf.status === 'validated' ? 'accent' : 'secondary'}
                  className="gap-1"
                >
                  {dpgf.status === 'validated' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Validé
                    </>
                  ) : (
                    'Extrait'
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {data.reference || dpgf.reference ? (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    {data.reference || dpgf.reference}
                  </span>
                ) : null}
                {dpgf.confidence && (
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Confiance: {(dpgf.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            {/* Actions flottantes */}
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              {dpgf.status !== 'validated' && (
                <Button size="sm" onClick={handleValidate}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Valider
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scroll container */}
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {/* Articles - Section collapsible */}
        {data.articles && data.articles.length > 0 && (
          <Card>
            <Collapsible
              open={expandedSections.articles}
              onOpenChange={() => toggleSection('articles')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Articles ({data.articles.length})
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        expandedSections.articles && 'rotate-180'
                      )}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {data.articles.map((article, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-l-4 border-primary pl-4 py-2 rounded-r-lg bg-accent/20"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Badge variant="outline" className="shrink-0">
                            Article {article.numero}
                          </Badge>
                          {article.titre && (
                            <h3 className="font-semibold text-foreground">{article.titre}</h3>
                          )}
                        </div>

                        {article.prescriptions && article.prescriptions.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                              <FileCheck className="h-4 w-4" />
                              Prescriptions
                            </h4>
                            <ul className="space-y-2 ml-6">
                              {article.prescriptions.map((prescription, pIndex) => (
                                <li
                                  key={pIndex}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="text-primary mt-1.5">•</span>
                                  <span className="flex-1">{prescription}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {article.materiaux && article.materiaux.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Matériaux
                            </h4>
                            <div className="space-y-2">
                              {article.materiaux.map((materiau, mIndex) => (
                                <div
                                  key={mIndex}
                                  className="bg-card border border-border rounded-lg p-3 ml-6"
                                >
                                  <p className="font-medium text-sm text-foreground">
                                    {materiau.designation}
                                  </p>
                                  {Object.keys(materiau.caracteristiques).length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {Object.entries(materiau.caracteristiques).map(
                                        ([key, value]) => (
                                          <div
                                            key={key}
                                            className="text-xs text-muted-foreground flex gap-2"
                                          >
                                            <span className="font-medium">{key}:</span>
                                            <span>{String(value)}</span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Matériaux généraux - Section collapsible */}
        {data.materiauxGeneraux && data.materiauxGeneraux.length > 0 && (
          <Card>
            <Collapsible
              open={expandedSections.materiaux}
              onOpenChange={() => toggleSection('materiaux')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Matériaux Généraux ({data.materiauxGeneraux.length})
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        expandedSections.materiaux && 'rotate-180'
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
                            Désignation
                          </th>
                          <th className="text-left p-3 text-sm font-semibold text-foreground">
                            Caractéristiques
                          </th>
                          <th className="text-left p-3 text-sm font-semibold text-foreground">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.materiauxGeneraux.map((materiau, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border hover:bg-accent/30 transition-colors"
                          >
                            <td className="p-3 text-sm font-medium text-foreground">
                              {materiau.designation}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {Object.keys(materiau.caracteristiques).length > 0 ? (
                                <div className="space-y-1">
                                  {Object.entries(materiau.caracteristiques).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">{key}:</span>{' '}
                                      <span>{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {materiau.notes || <span className="text-muted-foreground">—</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Normes - Section collapsible */}
        {data.normes && data.normes.length > 0 && (
          <Card>
            <Collapsible
              open={expandedSections.normes}
              onOpenChange={() => toggleSection('normes')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-primary" />
                      Normes et Référentiels ({data.normes.length})
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        expandedSections.normes && 'rotate-180'
                      )}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {data.normes.map((norme, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-1.5 px-3"
                      >
                        {norme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Observations */}
        {data.observations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
                Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {data.observations}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
