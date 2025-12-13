/**
 * Page de gestion des DPGF d'un projet
 * UI professionnelle pour écrans métiers - Design Modern SaaS Redyce
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { DPGFTableViewer } from '@/components/dpgf/DPGFTableViewer'
import { ArrowLeft, Package, Loader2, AlertCircle, Sparkles } from 'lucide-react'

export default function ProjectDPGFPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [dpgfs, setDpgfs] = useState<any[]>([])
  const [selectedDPGF, setSelectedDPGF] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
    fetchDPGFs()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()
      if (data.success && data.data) {
        setProject(data.data)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des DPGF...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/projects/${params.id}`)}
        className="rounded-xl"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au projet
      </Button>

      {/* Header */}
      <PageHeader
        title="DPGF Extraits"
        description={
          project
            ? `DPGF structurés pour le projet "${project.name}"`
            : 'Visualisez et gérez les DPGF structurés extraits'
        }
        actions={
          <Button onClick={handleExtractFromDocument} className="rounded-md">
            <Sparkles className="h-4 w-4 mr-2" />
            Extraire depuis document
          </Button>
        }
      />

      {/* Contenu */}
      {dpgfs.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-white p-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
            <Package className="h-8 w-8 text-[#151959]" />
          </div>
          <h3 className="text-xl font-semibold text-[#151959] mb-2">
            Aucun DPGF extrait
          </h3>
          <p className="text-sm text-[#64748b] mb-6 max-w-md mx-auto font-medium">
            Commencez par uploader des documents puis extrayez un DPGF pour voir les données structurées.
          </p>
          <Button onClick={handleExtractFromDocument} className="rounded-xl">
            <Sparkles className="h-4 w-4 mr-2" />
            Extraire un DPGF
          </Button>
        </div>
      ) : selectedDPGF ? (
        <DPGFTableViewer
          dpgfId={selectedDPGF}
          projectName={project?.name}
          onRefresh={fetchDPGFs}
        />
      ) : null}
    </div>
  )
}
