/**
 * Composant de visualisation d'un DPGF structuré
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Chargement du DPGF...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !dpgf) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-red-500">{error || 'DPGF not found'}</p>
        </CardContent>
      </Card>
    )
  }

  const data = dpgf.data as DPGFData

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{data.titre || dpgf.title}</CardTitle>
              <CardDescription>
                {data.reference || dpgf.reference || 'Sans référence'}
                {dpgf.confidence && (
                  <span className="ml-2">
                    • Confiance: {(dpgf.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                dpgf.status === 'validated'
                  ? 'bg-green-100 text-green-700'
                  : dpgf.status === 'extracted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {dpgf.status === 'validated' ? 'Validé' : 'Extrait'}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Articles */}
      {data.articles && data.articles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Articles ({data.articles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.articles.map((article, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg">
                    Article {article.numero}
                    {article.titre && ` - ${article.titre}`}
                  </h3>
                  {article.prescriptions && article.prescriptions.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Prescriptions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {article.prescriptions.map((prescription, pIndex) => (
                          <li key={pIndex} className="text-sm text-gray-600">
                            {prescription}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {article.materiaux && article.materiaux.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Matériaux:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {article.materiaux.map((materiau, mIndex) => (
                          <li key={mIndex} className="text-sm text-gray-600">
                            <strong>{materiau.designation}</strong>
                            {Object.keys(materiau.caracteristiques).length > 0 && (
                              <span className="text-gray-500">
                                {' '}
                                ({JSON.stringify(materiau.caracteristiques)})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matériaux généraux */}
      {data.materiauxGeneraux && data.materiauxGeneraux.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Matériaux Généraux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.materiauxGeneraux.map((materiau, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium">{materiau.designation}</h4>
                  {Object.keys(materiau.caracteristiques).length > 0 && (
                    <div className="mt-1 text-sm text-gray-600">
                      {Object.entries(materiau.caracteristiques).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                  {materiau.notes && (
                    <p className="mt-1 text-sm text-gray-500">{materiau.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Normes */}
      {data.normes && data.normes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Normes et Référentiels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.normes.map((norme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  {norme}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      {data.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.observations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

