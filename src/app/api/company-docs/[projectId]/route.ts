/**
 * Route API pour gérer les documents entreprise d'un projet
 * GET /api/company-docs/[projectId] - Liste les documents entreprise
 * DELETE /api/company-docs/[projectId]?documentId=xxx - Supprime un document
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { fileStorage } from '@/lib/documents/storage'
import { ApiResponse } from '@/types/api'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await requireAuth()
    const { projectId } = params

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

    // Récupérer tous les documents entreprise du projet
    const companyDocs = await prisma.document.findMany({
      where: {
        projectId,
        documentType: 'COMPANY_DOC',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        analyses: {
          where: {
            analysisType: 'extraction',
            status: 'completed',
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Formater la réponse
    const formattedDocs = companyDocs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      createdAt: doc.createdAt,
      hasContent: doc.analyses.length > 0,
    }))

    return NextResponse.json<ApiResponse<typeof formattedDocs>>(
      {
        success: true,
        data: formattedDocs,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching company documents:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch company documents',
        },
      },
      { 
        status: error instanceof NotFoundError ? 404 : 
                error instanceof UnauthorizedError ? 403 : 500 
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await requireAuth()
    const { projectId } = params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'documentId requis' },
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

    // Vérifier que le document existe et appartient au projet
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.projectId !== projectId || document.documentType !== 'COMPANY_DOC') {
      throw new UnauthorizedError('Document does not belong to this project or is not a company document')
    }

    // Supprimer le fichier physique
    try {
      await fileStorage.deleteFile(document.filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer l'enregistrement en DB (cascade supprimera les analyses)
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { message: 'Document supprimé avec succès' },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting company document:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete company document',
        },
      },
      { 
        status: error instanceof NotFoundError ? 404 : 
                error instanceof UnauthorizedError ? 403 : 500 
      }
    )
  }
}

