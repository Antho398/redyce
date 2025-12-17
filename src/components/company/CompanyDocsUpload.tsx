/**
 * Composant d'upload de documents entreprise
 * Spécifique à la page "Informations de l'entreprise"
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, FileText, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/helpers'

interface CompanyDoc {
  id: string
  name: string
  fileName: string
  fileSize: number
  status: string
  createdAt: string
}

interface CompanyDocsUploadProps {
  projectId: string
  onDocsChange?: (docs: CompanyDoc[]) => void
  compact?: boolean // Si true, n'affiche que la liste sans la dropzone
}

export function CompanyDocsUpload({ projectId, onDocsChange, compact = false }: CompanyDocsUploadProps) {
  const [docs, setDocs] = useState<CompanyDoc[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les documents existants
  useEffect(() => {
    fetchDocs()
  }, [projectId])

  const fetchDocs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/company-docs/${projectId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setDocs(data.data)
        onDocsChange?.(data.data)
      }
    } catch (error) {
      console.error('Error fetching company docs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // Un seul fichier à la fois pour simplifier

    // Vérifier le type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté', 'Formats acceptés: PDF, DOCX, DOC')
      return
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux', 'Taille maximale: 10MB')
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await fetch('/api/company-docs/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document uploadé', 'Le document sera traité en arrière-plan')
        await fetchDocs() // Recharger la liste
      } else {
        throw new Error(data.error?.message || 'Erreur lors de l\u2019upload')
      }
    } catch (error) {
      toast.error('Erreur', error instanceof Error ? error.message : 'Impossible d\u2019uploader le document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [projectId])

  const handleDelete = useCallback(async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) {
      return
    }

    try {
      const response = await fetch(`/api/company-docs/${projectId}?documentId=${docId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document supprimé')
        await fetchDocs() // Recharger la liste
      } else {
        throw new Error(data.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur', error instanceof Error ? error.message : 'Impossible de supprimer le document')
    }
  }, [projectId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Zone de drag & drop - masquée si compact */}
      {!compact && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            uploading && 'opacity-50 pointer-events-none'
          )}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <Upload className={cn('h-8 w-8 text-muted-foreground', isDragging && 'text-primary')} />
            <div className="text-center">
              <p className="text-sm font-medium">
                Glissez-déposez un fichier ici ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                  disabled={uploading}
                >
                  parcourez
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, DOC (max 10MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </div>
      )}

      {/* Zone de drag & drop compacte pour modal */}
      {compact && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-4 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              uploading && 'opacity-50 pointer-events-none'
            )}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className={cn('h-6 w-6 text-muted-foreground', isDragging && 'text-primary')} />
              <div className="text-center">
                <p className="text-sm">
                  Glissez-déposez un fichier ici ou{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                    disabled={uploading}
                  >
                    parcourez
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, DOC (max 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>
        </>
      )}

      {/* Liste des documents */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)} • {doc.status === 'processed' ? 'Traité' : 'En traitement'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export pour récupérer les documents depuis l'extérieur
export type { CompanyDoc }

