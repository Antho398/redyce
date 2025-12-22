/**
 * Route API pour l'upload de documents méthodologie
 * POST /api/methodology-documents/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { methodologyDocumentService } from '@/services/methodology-document-service'
import { fileStorage } from '@/lib/documents/storage'
import { ApiResponse } from '@/types/api'
import { MAX_FILE_SIZE } from '@/config/constants'

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const documentType = formData.get('documentType') as string | null
    const clientId = formData.get('clientId') as string | null

    if (!file) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'No file provided' },
        },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Client ID is required' },
        },
        { status: 400 }
      )
    }

    if (!documentType || !['REFERENCE_MEMO', 'EXAMPLE_ANSWER', 'STYLE_GUIDE'].includes(documentType)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Invalid document type' },
        },
        { status: 400 }
      )
    }

    // Valider la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: `File size exceeds maximum of ${MAX_FILE_SIZE} bytes` },
        },
        { status: 400 }
      )
    }

    // Valider le type MIME
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain', // Ajout du support pour les fichiers texte
    ]

    let mimeType = file.type || ''
    if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
      const { detectMimeTypeFromFilename } = await import('@/lib/documents/parser')
      const detected = detectMimeTypeFromFilename(file.name)
      if (detected && supportedMimeTypes.includes(detected)) {
        mimeType = detected
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: { message: 'Unsupported file type. Supported: PDF, DOCX, DOC, TXT' },
          },
          { status: 400 }
        )
      }
    }

    // Sauvegarder le fichier
    const buffer = Buffer.from(await file.arrayBuffer())
    const { filePath, fileName } = await fileStorage.saveFile(buffer, file.name)

    // Créer l'enregistrement en DB
    const document = await methodologyDocumentService.createDocument({
      userId,
      clientId,
      name: file.name,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType,
      documentType: documentType as 'REFERENCE_MEMO' | 'EXAMPLE_ANSWER' | 'STYLE_GUIDE',
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: document,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Error uploading methodology document:', error)

    const message = error instanceof Error ? error.message : 'Failed to upload document'

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status: 500 }
    )
  }
}
