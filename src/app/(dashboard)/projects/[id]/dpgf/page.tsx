/**
 * Page de gestion des DPGF d'un projet
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DPGFViewer } from '@/components/dpgf/DPGFViewer'
import { ArrowLeft, FileText, Sparkles, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectDPGFPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [dpgfs, setDpgfs] = useState<any[]>([])
  const [selectedDPGF, setSelectedDPGF] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDPGFs()
  }, [params.id])

  const fetchDPGFs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dpgf?projectId=${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setDpgfs(data.data)
        if (data.data.length > 0 && !selectedDPGF) {
          setSelectedDPGF(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching DPGFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExtractFromDocument = () => {
    router.push(`/projects/${params.id}/documents`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">DPGF Extraits</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez et gérez les DPGF structurés extraits
          </p>
        </div>
        <Button onClick={handleExtractFromDocument}>
          <Sparkles className="h-4 w-4 mr-2" />
          Extraire depuis document
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          </CardContent>
        </Card>
      ) : dpgfs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucun DPGF extrait pour ce projet</p>
            <Button onClick={handleExtractFromDocument}>
              <Plus className="h-4 w-4 mr-2" />
              Extraire un DPGF
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des DPGF */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>DPGF ({dpgfs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dpgfs.map((dpgf) => (
                    <button
                      key={dpgf.id}
                      onClick={() => setSelectedDPGF(dpgf.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDPGF === dpgf.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-sm">{dpgf.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dpgf.reference || 'Sans référence'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            dpgf.status === 'validated'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {dpgf.status === 'validated' ? 'Validé' : 'Extrait'}
                        </span>
                        {dpgf.confidence && (
                          <span className="text-xs text-gray-500">
                            {(dpgf.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualisation du DPGF sélectionné */}
          <div className="lg:col-span-2">
            {selectedDPGF && <DPGFViewer dpgfId={selectedDPGF} />}
          </div>
        </div>
      )}
    </div>
  )
}

