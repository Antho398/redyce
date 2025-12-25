/**
 * Route API pour l'upload de documents
 * POST /api/documents/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { fileStorage } from '@/lib/documents/storage'
import { documentUploadSchema } from '@/lib/utils/validation'
import { MAX_FILE_SIZE } from '@/config/constants'
import { ApiResponse, UploadResponse } from '@/types/api'
import { requireAuth, requireProjectAccess } from '@/lib/utils/project-access'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'
import { requirementExtractionJob } from '@/services/requirement-extraction-job'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const formData = await request.formData()
  
  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null
  const documentType = formData.get('documentType') as string | null

  logOperationStart('Document Upload', {
    userId,
    projectId,
    fileName: file?.name,
    fileSize: file?.size,
    mimeType: file?.type,
    documentType: documentType || undefined,
  })

  try {
    // Validation avec Zod
    const validation = documentUploadSchema.safeParse({
      projectId,
      documentType,
    })

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'No file provided',
          },
        },
        { status: 400 }
      )
    }

    const { projectId: validatedProjectId, documentType: validatedDocumentType } = validation.data

    // Vérifier l'accès au projet (sécurité)
    await requireProjectAccess(validatedProjectId, userId)

    // Valider la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: `File size exceeds maximum of ${MAX_FILE_SIZE} bytes`,
          },
        },
        { status: 400 }
      )
    }

    // Valider le type MIME
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ]

    // Si le type MIME n'est pas fourni ou non reconnu, essayer de le détecter depuis le nom
    let mimeType = file.type || ''
    if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
      const { detectMimeTypeFromFilename } = await import('@/lib/documents/parser')
      const detected = detectMimeTypeFromFilename(file.name)
      if (detected) {
        mimeType = detected
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Unsupported file type. Supported types: PDF, DOCX, DOC, JPEG, PNG, GIF`,
            },
          },
          { status: 400 }
        )
      }
    }

    if (!supportedMimeTypes.includes(mimeType)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: `Unsupported file type: ${file.type || 'unknown'}. Supported types: PDF, DOCX, DOC, JPEG, PNG, GIF`,
          },
        },
        { status: 400 }
      )
    }

    // Sauvegarder le fichier
    const buffer = Buffer.from(await file.arrayBuffer())
    const { filePath, fileName } = await fileStorage.saveFile(buffer, file.name)

    // Créer l'enregistrement en DB
    const document = await documentService.createDocument({
      name: file.name,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: mimeType,
      documentType: validatedDocumentType,
      projectId: validatedProjectId,
      userId,
    })

    const response: UploadResponse = {
      documentId: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      status: document.status,
    }

    logOperationSuccess('Document Upload', {
      userId,
      projectId,
      documentId: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
    })

    // Lancer l'extraction des exigences en arrière-plan (non bloquant)
    // L'extraction se fait de manière asynchrone pour ne pas bloquer l'upload
    setImmediate(async () => {
      try {
        console.log(`[Document Upload] Starting background requirement extraction for document ${document.id}`)
        await requirementExtractionJob.extractForDocument(document.id, userId)
        console.log(`[Document Upload] Background requirement extraction completed for document ${document.id}`)
      } catch (error) {
        console.error(`[Document Upload] Background requirement extraction failed for document ${document.id}:`, error)
        // L'erreur est déjà gérée dans le job (statut ERROR en DB)
      }
    })

    return NextResponse.json<ApiResponse<UploadResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    )
  } catch (error) {
    logOperationError('Document Upload', error as Error, {
      userId,
      projectId,
      fileName: file?.name,
    })
    
    // Gérer les différents types d'erreurs
    if (error instanceof Error) {
      // NotFoundError ou autres erreurs personnalisées
      if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
        const statusCode = (error as any).statusCode
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: error.message,
            },
          },
          { status: statusCode }
        )
      }
    }
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to upload document',
        },
      },
      { status: 500 }
    )
  }
}

