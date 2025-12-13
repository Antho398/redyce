/**
 * Route API pour l'upload de documents
 * POST /api/documents/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/services/document-service'
import { fileStorage } from '@/lib/documents/storage'
import { uploadDocumentSchema } from '@/lib/utils/validation'
import { MAX_FILE_SIZE } from '@/config/constants'
import { ApiResponse, UploadResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

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

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Project ID is required',
          },
        },
        { status: 400 }
      )
    }

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
      documentType: documentType || undefined,
      projectId,
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

