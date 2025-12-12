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

function getUserId(): string {
  return 'mock-user-id'
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const documentType = formData.get('documentType') as string | null

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
    if (file.type !== 'application/pdf') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Only PDF files are supported',
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
      mimeType: file.type,
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

    return NextResponse.json<ApiResponse<UploadResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading document:', error)
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

