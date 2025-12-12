/**
 * Page de génération et gestion des CCTP d'un projet
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CCTPGenerator } from '@/components/cctp/CCTPGenerator'
import { CCTPViewer } from '@/components/cctp/CCTPViewer'
import { ArrowLeft, FileText, Sparkles, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectCCTPPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [cctps, setCctps] = useState<any[]>([])
  const [selectedCCTP, setSelectedCCTP] = useState<string | null>(null)
  const [selectedDPGF, setSelectedDPGF] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCCTPs()
    fetchDPGFs()
  }, [params.id])

  const fetchCCTPs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cctp?projectId=${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setCctps(data.data)
        if (data.data.length > 0 && !selectedCCTP) {
          setSelectedCCTP(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching CCTPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDPGFs = async () => {
    try {
      const response = await fetch(`/api/dpgf?projectId=${params.id}`)
      const data = await response.json()

      if (data.success && data.data && data.data.length > 0) {
        // Sélectionner le premier DPGF validé ou le premier disponible
        const validated = data.data.find((d: any) => d.status === 'validated')
        setSelectedDPGF(validated?.id || data.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching DPGFs:', error)
    }
  }

  const handleGenerateComplete = (cctpId: string) => {
    setSelectedCCTP(cctpId)
    setShowGenerator(false)
    fetchCCTPs()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">CCTP Générés</h1>
          <p className="text-muted-foreground mt-1">
            Génerez et gérez vos CCTP (Cahier des Clauses Techniques Particulières)
          </p>
        </div>
        <Button onClick={() => setShowGenerator(!showGenerator)}>
          {showGenerator ? (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Voir les CCTP
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Générer un CCTP
            </>
          )}
        </Button>
      </div>

      {showGenerator ? (
        <div className="max-w-2xl mx-auto">
          <CCTPGenerator
            projectId={params.id}
            dpgfId={selectedDPGF || undefined}
            onGenerateComplete={handleGenerateComplete}
          />
        </div>
      ) : cctps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucun CCTP généré pour ce projet</p>
            <Button onClick={() => setShowGenerator(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer votre premier CCTP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des CCTP */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold">CCTP ({cctps.length})</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {cctps.map((cctp) => (
                    <button
                      key={cctp.id}
                      onClick={() => setSelectedCCTP(cctp.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedCCTP === cctp.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-sm">{cctp.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Version {cctp.version}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
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
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Visualisation du CCTP sélectionné */}
          <div className="lg:col-span-2">
            {selectedCCTP && (
              <CCTPViewer
                cctpId={selectedCCTP}
                onEdit={() => {
                  // TODO: Implémenter l'édition
                  console.log('Edit CCTP')
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

