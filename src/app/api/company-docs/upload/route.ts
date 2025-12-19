/**
 * Route API pour l'upload de documents entreprise
 * POST /api/company-docs/upload
 * Upload spécifique pour les documents entreprise (plaquette, présentation, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { fileStorage } from '@/lib/documents/storage'
import { documentService } from '@/services/document-service'
import { ApiResponse, UploadResponse } from '@/types/api'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { MAX_FILE_SIZE } from '@/config/constants'

const supportedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const formData = await request.formData()
    
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Aucun fichier fourni' },
        },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'projectId requis' },
        },
        { status: 400 }
      )
    }

    // Vérifier que le projet existe et appartient à l'utilisateur
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: `Fichier trop volumineux. Taille maximale: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          },
        },
        { status: 400 }
      )
    }

    // Vérifier le type MIME
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
            error: {
              message: 'Type de fichier non supporté. Formats acceptés: PDF, DOCX, DOC',
            },
          },
          { status: 400 }
        )
      }
    }

    // Sauvegarder le fichier
    const buffer = Buffer.from(await file.arrayBuffer())
    const { filePath, fileName } = await fileStorage.saveFile(buffer, file.name)

    // Créer l'enregistrement en DB avec documentType = COMPANY_DOC
    const document = await documentService.createDocument({
      name: file.name,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: mimeType,
      documentType: 'COMPANY_DOC',
      projectId: projectId,
      userId,
    })

    // Traiter le document pour extraire le texte (asynchrone, sans bloquer)
    // L'extraction sera utilisée lors de la génération IA
    const { DocumentProcessor } = await import('@/lib/documents/processors/document-processor')
    const processor = new DocumentProcessor()
    
    // Traitement en arrière-plan (ne pas bloquer la réponse)
    processor.processDocument(buffer, mimeType, 'COMPANY_DOC').then(async (result) => {
      // Mettre à jour le document avec le contenu extrait
      await prisma.documentAnalysis.create({
        data: {
          documentId: document.id,
          analysisType: 'extraction',
          status: 'completed',
          result: {
            extractedContent: {
              text: result.extractedContent.text,
              metadata: result.metadata,
            },
          },
        },
      })

      // Mettre à jour le statut du document
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'processed' },
      })
    }).catch((error) => {
      console.error('Error processing company document:', error)
      // Mettre à jour le statut en erreur
      prisma.document.update({
        where: { id: document.id },
        data: { status: 'error' },
      }).catch(console.error)
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
    console.error('Error uploading company document:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to upload company document',
        },
      },
      { status: error instanceof NotFoundError || error instanceof UnauthorizedError ? 403 : 500 }
    )
  }
}


