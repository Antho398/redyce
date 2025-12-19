/**
 * Composant d'upload de documents multi-format
 * Design premium style Dropbox/Notion avec drag & drop
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Cloud,
  FileType,
} from 'lucide-react'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { cn } from '@/lib/utils/helpers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
  documentType?: string
}

interface DocumentUploadProps {
  projectId: string
  onUploadComplete?: (documentId?: string) => void
  accept?: string
  documentType?: string // Type pré-sélectionné (optionnel)
  onPendingFilesChange?: (count: number) => void // Callback pour notifier le parent du nombre de fichiers pending
  hideTypeSelector?: boolean // Si vrai, masque le select et force le type fourni
  maxFiles?: number // Nombre maximum de fichiers autorisés (optionnel)
  disabled?: boolean // Si vrai, désactive complètement la zone d'upload (grisée)
  alignOffset?: string // Offset pour aligner le rectangle (ex: 'mt-[25.6px]')
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext || '')) return FileText
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon
  return File
}

const getFilePreview = (file: File): string | null => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file)
  }
  return null
}

// Contenu du tooltip sur les formats
function FormatTooltipContent() {
  return (
    <div className="space-y-3 text-left">
      <p className="font-semibold text-sm text-foreground">Format du template</p>
      
      {/* DOCX */}
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
          <FileType className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">DOCX</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              Recommandé
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Injection automatique du contenu généré
          </p>
        </div>
      </div>

      {/* PDF */}
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center flex-shrink-0">
          <File className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">PDF</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Injection impossible, copier-coller requis
          </p>
        </div>
      </div>
    </div>
  )
}

export function DocumentUpload({
  projectId,
  onUploadComplete,
  accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png,.gif',
  documentType: initialDocumentType,
  onPendingFilesChange,
  hideTypeSelector = false,
  maxFiles,
  disabled = false,
  alignOffset,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [documentType, setDocumentType] = useState<string>(initialDocumentType || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocument, loading } = useDocumentUpload()

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove?.file && fileToRemove.file.type.startsWith('image/')) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove.file))
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const uploadFile = useCallback(async (uploadedFile: UploadedFile) => {
    // Utiliser le type sélectionné ou "AUTRE" par défaut
    const fileDocType = uploadedFile.documentType || documentType || 'AUTRE'

    setFiles((prev) =>
      prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    try {
      const result = await uploadDocument(uploadedFile.file, projectId, fileDocType)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'success', progress: 100 } : f
        )
      )

      if (onUploadComplete && result.documentId) {
        onUploadComplete(result.documentId)
      }

      // Supprimer automatiquement après 3 secondes si succès
      setTimeout(() => {
        removeFile(uploadedFile.id)
      }, 3000)
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : f
        )
      )
    }
  }, [documentType, projectId, uploadDocument, onUploadComplete, removeFile])

  const handleFiles = useCallback((fileList: File[]) => {
    // Limiter le nombre de fichiers si maxFiles est défini
    const remaining = typeof maxFiles === 'number' ? Math.max(maxFiles - files.length, 0) : fileList.length
    const limitedFiles = remaining === fileList.length ? fileList : fileList.slice(0, remaining)
    if (limitedFiles.length === 0) return

    const newFiles: UploadedFile[] = limitedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending' as const,
      documentType: documentType || undefined,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    
    // Upload automatique (avec "AUTRE" par défaut si aucun type n'est sélectionné)
    newFiles.forEach((uploadedFile) => {
      uploadFile(uploadedFile)
    })
  }, [documentType, uploadFile, files.length, maxFiles])

  // Appliquer rétroactivement le documentType aux fichiers pending quand il change
  // et déclencher l'upload automatiquement
  useEffect(() => {
    if (documentType) {
      setFiles((prev) => {
        const filesToUpdate = prev.filter((f) => !f.documentType && f.status === 'pending')
        if (filesToUpdate.length === 0) return prev

        return prev.map((f) => {
          if (!f.documentType && f.status === 'pending') {
            const updatedFile = {
              ...f,
              documentType,
              error: undefined, // Supprimer l'erreur "type manquant" si elle existe
            }
            // Déclencher l'upload automatiquement pour ce fichier
            setTimeout(() => uploadFile(updatedFile), 0)
            return updatedFile
          }
          return f
        })
      })
    }
  }, [documentType, uploadFile])

  // Notifier le parent du nombre de fichiers pending
  useEffect(() => {
    const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length
    onPendingFilesChange?.(pendingCount)
  }, [files, onPendingFilesChange])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragging(false)
      }
      return newCounter
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setDragCounter(0)

      const droppedFiles = Array.from(e.dataTransfer.files)
      handleFiles(droppedFiles)
    },
    [handleFiles]
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
    // Reset input pour permettre de sélectionner le même fichier à nouveau
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(!hideTypeSelector ? 'flex flex-col gap-[18px]' : 'space-y-[18px]')}>
      {/* Type de document selector - OBLIGATOIRE sauf si forcé */}
      {!hideTypeSelector && (
        <div>
          <Label htmlFor="document-type" className="mb-2">
            Type de document
          </Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="document-type">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AE">AE (Avant-Projet)</SelectItem>
              <SelectItem value="RC">RC (Règlement de Consultation)</SelectItem>
              <SelectItem value="CCAP">CCAP (Cahier des Clauses Administratives Particulières)</SelectItem>
              <SelectItem value="CCTP">CCTP (Cahier des Clauses Techniques Particulières)</SelectItem>
              <SelectItem value="DPGF">DPGF (Dossier de Prescription Générale des Fournitures)</SelectItem>
              <SelectItem value="MODELE_MEMOIRE">Template mémoire</SelectItem>
              <SelectItem value="AUTRE">Autre</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Vous pouvez aussi choisir un type avant l&apos;upload pour pré-remplir, puis ajuster ensuite.
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <motion.div
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden h-[220px] flex items-center justify-center',
          alignOffset && !hideTypeSelector && alignOffset,
          disabled
            ? 'border-border/50 bg-muted/30 cursor-not-allowed opacity-50'
            : isDragging
            ? 'border-primary bg-accent/50 scale-[1.02] shadow-lg'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/20'
        )}
        animate={{
          scale: disabled ? 1 : isDragging ? 1.02 : 1,
          borderColor: disabled ? undefined : isDragging ? 'var(--primary)' : undefined,
        }}
      >
        {/* Animated background gradient on drag */}
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-[#F8D347]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        <div className="relative z-10 p-8 text-center w-full">
          <motion.div
            animate={{
              y: isDragging ? -8 : 0,
              scale: isDragging ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative cursor-help">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                  <motion.div
                    animate={{ rotate: isDragging ? 360 : 0 }}
                    transition={{ duration: 2, repeat: isDragging ? Infinity : 0, ease: 'linear' }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent border-2 border-primary/20"
                  >
                    {isDragging ? (
                      <Cloud className="h-10 w-10 text-primary" />
                    ) : (
                      <Upload className="h-10 w-10 text-primary" />
                    )}
                  </motion.div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="w-[280px]">
                <FormatTooltipContent />
              </TooltipContent>
            </Tooltip>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {disabled
                  ? 'Template déjà défini'
                  : isDragging
                  ? 'Déposez vos fichiers ici'
                  : 'Glissez-déposez vos fichiers'}
              </h3>
              {disabled ? (
                <p className="text-xs text-muted-foreground">
                  Un template mémoire est déjà défini pour ce projet
                </p>
              ) : documentType ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    ou{' '}
                    <button
                      type="button"
                      onClick={() => !disabled && fileInputRef.current?.click()}
                      className={cn(
                        'font-medium',
                        disabled
                          ? 'text-muted-foreground cursor-not-allowed'
                          : 'text-primary hover:underline'
                      )}
                      disabled={disabled}
                    >
                      parcourez vos fichiers
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés: PDF, DOCX, JPEG, PNG, GIF • Max 50 Mo
                  </p>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Import rapide</p>
                  <p className="text-xs text-muted-foreground">
                    Optionnel : sélectionnez un type avant l&apos;upload pour pré-remplir. Sinon, vous pourrez le modifier après import.
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              disabled={disabled}
              className="hidden"
              aria-label="Sélectionner des fichiers à téléverser"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Files List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-xs"
              >
                Tout effacer
              </Button>
            </div>

            <div className="space-y-2">
              {files.map((uploadedFile, index) => {
                const FileIcon = getFileIcon(uploadedFile.file.name)
                const preview = getFilePreview(uploadedFile.file)

                return (
                  <motion.div
                    key={uploadedFile.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card className="overflow-hidden border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Preview / Icon */}
                          <div className="relative flex-shrink-0">
                            {preview ? (
                              <div className="h-12 w-12 rounded-lg overflow-hidden border border-border bg-accent/50">
                                <img
                                  src={preview}
                                  alt={uploadedFile.file.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent border border-border">
                                <FileIcon className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            {uploadedFile.status === 'uploading' && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {uploadedFile.file.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(uploadedFile.file.size)}
                              </p>
                              {uploadedFile.status === 'uploading' && (
                                <span className="text-xs text-muted-foreground">
                                  Téléversement...
                                </span>
                              )}
                              {uploadedFile.status === 'error' && (
                                <span className="text-xs text-destructive flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {uploadedFile.error || 'Erreur'}
                                </span>
                              )}
                              {uploadedFile.status === 'success' && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Terminé
                                </span>
                              )}
                            </div>
                            {uploadedFile.status === 'uploading' && (
                              <div className="mt-2 h-1.5 w-full rounded-full bg-accent overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ duration: 2, ease: 'easeOut' }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {uploadedFile.status === 'success' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-green-600"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </motion.div>
                            )}
                            {uploadedFile.status !== 'success' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(uploadedFile.id)}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
