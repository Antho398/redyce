/**
 * Composant d'upload de documents multi-format
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, File, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { toastSuccess, toastError } from '@/lib/toast'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
}

interface DocumentUploadProps {
  projectId: string
  onUploadComplete?: (documentId: string) => void
  accept?: string
}

export function DocumentUpload({
  projectId,
  onUploadComplete,
  accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png,.gif',
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [documentType, setDocumentType] = useState<string>('')
  const { uploadDocument, loading } = useDocumentUpload()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      handleFiles(droppedFiles)
    },
    []
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }, [])

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    try {
      // Utiliser le hook useDocumentUpload qui gère déjà les toasts
      const result = await uploadDocument(
        uploadedFile.file,
        projectId,
        documentType || undefined
      )

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'success', progress: 100 } : f
        )
      )

      if (onUploadComplete && result.documentId) {
        onUploadComplete(result.documentId)
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : f
        )
      )
      // Le toast d'erreur est déjà géré par useDocumentUpload
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter des Documents</CardTitle>
        <CardDescription>
          Glissez-déposez vos fichiers ou cliquez pour sélectionner (PDF, DOCX, images)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection du type de document */}
        <div>
          <label className="text-sm font-medium mb-2 block">Type de document (optionnel)</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Détection automatique</option>
            <option value="DPGF">DPGF</option>
            <option value="CCTP">CCTP</option>
            <option value="RC">RC</option>
            <option value="CCAP">CCAP</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        {/* Zone de drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Glissez-déposez vos fichiers ici ou
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="file-upload">
            <Button as="span" variant="outline">
              Sélectionner des fichiers
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">Formats supportés: PDF, DOCX, JPEG, PNG, GIF</p>
        </div>

        {/* Liste des fichiers */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
              </span>
              <Button 
                onClick={uploadAll} 
                disabled={files.every((f) => f.status !== 'pending') || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Téléversement...
                  </>
                ) : (
                  'Téléverser tout'
                )}
              </Button>
            </div>

            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <File className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.file.size)}</p>
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-1 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-xs text-gray-500">Téléversement en cours...</span>
                    </div>
                  )}
                  {uploadedFile.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{uploadedFile.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {uploadedFile.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => uploadFile(uploadedFile)}
                    >
                      Uploader
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

