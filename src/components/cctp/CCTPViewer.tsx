/**
 * Composant de visualisation d'un CCTP généré
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Edit, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface CCTPViewerProps {
  cctpId: string
  onEdit?: () => void
}

export function CCTPViewer({ cctpId, onEdit }: CCTPViewerProps) {
  const [cctp, setCctp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'text' | 'structure'>('text')

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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Chargement du CCTP...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !cctp) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-red-500">{error || 'CCTP not found'}</p>
        </CardContent>
      </Card>
    )
  }

  const structure = cctp.structure as any

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{cctp.title}</CardTitle>
              <CardDescription>
                Version {cctp.version}
                {cctp.reference && ` • Référence: ${cctp.reference}`}
                {cctp.dpgf && ` • Depuis DPGF: ${cctp.dpgf.title}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  cctp.status === 'finalized'
                    ? 'bg-green-100 text-green-700'
                    : cctp.status === 'generated'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cctp.status === 'finalized'
                  ? 'Finalisé'
                  : cctp.status === 'generated'
                  ? 'Généré'
                  : 'Brouillon'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('text')}>
              <FileText className="h-4 w-4 mr-2" />
              Texte
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('structure')}>
              Structure
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            {cctp.status !== 'finalized' && (
              <Button size="sm" onClick={handleFinalize}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finaliser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenu */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu du CCTP</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'text' ? (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded">
                {cctp.content}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              {structure?.projet && (
                <div>
                  <h3 className="font-semibold mb-2">Projet</h3>
                  <div className="pl-4 space-y-1 text-sm">
                    <p><strong>Nom:</strong> {structure.projet.nom}</p>
                    {structure.projet.reference && (
                      <p><strong>Référence:</strong> {structure.projet.reference}</p>
                    )}
                    {structure.projet.lieu && (
                      <p><strong>Lieu:</strong> {structure.projet.lieu}</p>
                    )}
                  </div>
                </div>
              )}

              {structure?.sections && structure.sections.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Sections</h3>
                  <div className="space-y-3">
                    {structure.sections.map((section: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">{section.titre}</h4>
                        <p className="text-sm text-gray-600 mt-1">{section.contenu}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {structure?.prescriptionsTechniques &&
                structure.prescriptionsTechniques.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Prescriptions Techniques</h3>
                    <div className="space-y-4">
                      {structure.prescriptionsTechniques.map((presc: any, index: number) => (
                        <div key={index} className="border rounded p-4">
                          <h4 className="font-medium">
                            {presc.article} - {presc.titre}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{presc.description}</p>
                          {presc.exigences && presc.exigences.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium">Exigences:</h5>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {presc.exigences.map((ex: string, exIndex: number) => (
                                  <li key={exIndex}>{ex}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {presc.normes && presc.normes.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium">Normes:</h5>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {presc.normes.map((norme: string, nIndex: number) => (
                                  <span
                                    key={nIndex}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                  >
                                    {norme}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

