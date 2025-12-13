/**
 * Page de gestion des documents d'un projet
 * Utilise le design system Redyce
 */

'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft, Upload, FileCheck, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const projectId = params.id
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Rafraîchir la liste des documents après un upload réussi
    setRefreshKey((prev) => prev + 1)
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/projects/${projectId}/documents/${documentId}`)
  }

  return (
    <div className="space-y-8">
      {/* Navigation retour */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.push(`/projects/${projectId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au projet
      </Button>

      <PageHeader
        title="Documents du projet"
        description="Importez vos documents techniques (CCTP, DPGF, RC, CCAP) pour les analyser et générer des mémoires automatiquement"
      />

      {/* Section 1 : Importer des documents */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-dashed border-border/50 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E3E7FF]/50 flex items-center justify-center border border-[#151959]/10">
              <Upload className="h-5 w-5 text-[#151959]" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-[#151959]">Importer des documents</CardTitle>
              <CardDescription className="mt-1.5 text-[#64748b]">
                Formats supportés : PDF, DOCX, JPEG, PNG, GIF • Taille max : 50 Mo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Section 2 : Documents du projet */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#151959] mb-1.5">
            Documents du projet
          </h2>
          <p className="text-sm text-[#64748b] font-medium">
            Gérez et visualisez vos documents uploadés
          </p>
        </div>

        <DocumentList
          key={refreshKey}
          projectId={projectId}
          onDocumentClick={handleDocumentClick}
        />
      </div>

      {/* Section 3 : Prochaines étapes */}
      <Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] bg-[#E3E7FF]/30 border-[#151959]/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#151959] mb-1.5">
                Prochaines étapes
              </h3>
              <p className="text-sm text-[#64748b] font-medium">
                Une fois vos documents uploadés, vous pouvez extraire un DPGF ou générer un CCTP
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/dpgf`)}
                className="rounded-xl"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Voir le DPGF
              </Button>
              <Button
                variant="default"
                onClick={() => router.push(`/projects/${projectId}/cctp`)}
                className="rounded-xl"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer un CCTP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

