/**
 * Page de génération et gestion des CCTP d'un projet
 * UI professionnelle avec layout split (sommaire + contenu)
 * Design Modern SaaS Redyce
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { CCTPSplitViewer } from '@/components/cctp/CCTPSplitViewer'
import { CCTPGenerator } from '@/components/cctp/CCTPGenerator'
import { ArrowLeft, FileCheck, Loader2, Sparkles, AlertCircle } from 'lucide-react'

export default function ProjectCCTPPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [project, setProject] = useState<any>(null)
  const [cctps, setCctps] = useState<any[]>([])
  const [selectedCCTP, setSelectedCCTP] = useState<string | null>(null)
  const [selectedDPGF, setSelectedDPGF] = useState<string | null>(
    searchParams.get('dpgfId')
  )
  const [showGenerator, setShowGenerator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
    fetchCCTPs()
    if (searchParams.get('dpgfId')) {
      fetchDPGFs()
    }
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
        const dpgfId = searchParams.get('dpgfId')
        if (dpgfId) {
          const found = data.data.find((d: any) => d.id === dpgfId)
          if (found) {
            setSelectedDPGF(dpgfId)
            return
          }
        }
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
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des CCTP...</p>
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
        title="CCTP Générés"
        description={
          project
            ? `Cahiers des Clauses Techniques Particulières pour "${project.name}"`
            : 'Générez et gérez vos CCTP (Cahier des Clauses Techniques Particulières)'
        }
        actions={
          <Button
            onClick={() => setShowGenerator(!showGenerator)}
            variant={showGenerator ? 'outline' : 'default'}
            className="rounded-xl"
          >
            {showGenerator ? (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Voir les CCTP
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer un CCTP
              </>
            )}
          </Button>
        }
      />

      {/* Contenu */}
      {showGenerator ? (
        <div className="max-w-3xl mx-auto">
          <CCTPGenerator
            projectId={params.id}
            dpgfId={selectedDPGF || undefined}
            onGenerateComplete={handleGenerateComplete}
          />
        </div>
      ) : cctps.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-white p-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
            <FileCheck className="h-8 w-8 text-[#151959]" />
          </div>
          <h3 className="text-xl font-semibold text-[#151959] mb-2">
            Aucun CCTP généré
          </h3>
          <p className="text-sm text-[#64748b] mb-6 max-w-md mx-auto font-medium">
            Générez votre premier CCTP depuis un DPGF ou des documents pour commencer.
          </p>
          <Button onClick={() => setShowGenerator(true)} className="rounded-xl">
            <Sparkles className="h-4 w-4 mr-2" />
            Générer votre premier CCTP
          </Button>
        </div>
      ) : selectedCCTP ? (
        <CCTPSplitViewer cctpId={selectedCCTP} projectName={project?.name} />
      ) : null}
    </div>
  )
}
