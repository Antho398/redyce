/**
 * Service métier pour la gestion des documents
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { DOCUMENT_STATUS } from '@/config/constants'

export class DocumentService {
  private processor = new DocumentProcessor()

  /**
   * Crée un nouveau document depuis un upload
   */
  async createDocument(data: {
    name: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    documentType: string // Obligatoire maintenant
    projectId: string
    userId: string
  }) {
    // Vérifier que l'utilisateur a accès au projet
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', data.projectId)
    }

    if (project.userId !== data.userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.document.create({
      data: {
        name: data.name,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        documentType: data.documentType,
        projectId: data.projectId,
        status: DOCUMENT_STATUS.UPLOADED,
      },
    })
  }

  /**
   * Récupère tous les documents d'un utilisateur (tous projets confondus)
   */
  async getUserDocuments(userId: string) {
    return await prisma.document.findMany({
      where: {
        project: {
          userId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            analyses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupère tous les documents d'un projet
   */
  async getProjectDocuments(projectId: string, userId: string) {
    // Vérifier l'accès
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.document.findMany({
      where: { projectId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            analyses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupère un document par ID
   */
  async getDocumentById(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    return document
  }

  /**
   * Lance le traitement (parsing + extraction) d'un document
   */
  async processDocument(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId)

    // Vérifier que le type MIME est supporté
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ]
    
    if (!supportedMimeTypes.includes(document.mimeType)) {
      throw new Error(`Unsupported file type: ${document.mimeType}. Supported types: PDF, DOCX, JPEG, PNG, GIF`)
    }

    // Mettre à jour le statut
    await prisma.document.update({
      where: { id: documentId },
      data: { status: DOCUMENT_STATUS.PROCESSING },
    })

    try {
      // Lire le fichier
      const buffer = await fileStorage.readFile(document.filePath)

      // Traiter le document avec le type MIME
      const result = await this.processor.processDocument(
        buffer,
        document.mimeType,
        document.documentType || undefined
      )

      // Créer l'analyse
      const analysis = await prisma.documentAnalysis.create({
        data: {
          documentId,
          analysisType: 'extraction',
          status: 'completed',
          result: result as any,
          metadata: {
            documentType: result.documentType,
            pages: result.extractedContent.metadata.pages,
          },
        },
      })

      // Mettre à jour le statut du document
      await prisma.document.update({
        where: { id: documentId },
        data: { status: DOCUMENT_STATUS.PROCESSED },
      })

      return analysis
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DOCUMENT_STATUS.ERROR,
        },
      })

      throw error
    }
  }

  /**
   * Met à jour un document (documentType, name, etc.)
   */
  async updateDocument(
    documentId: string,
    userId: string,
    data: {
      documentType?: string
      name?: string
    }
  ) {
    const document = await this.getDocumentById(documentId, userId)

    return await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(data.documentType && { documentType: data.documentType }),
        ...(data.name && { name: data.name }),
      },
    })
  }

  /**
   * Supprime un document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getDocumentById(documentId, userId)

    // Supprimer le fichier
    await fileStorage.deleteFile(document.filePath)

    // Supprimer l'enregistrement DB (cascade supprimera les analyses)
    await prisma.document.delete({
      where: { id: documentId },
    })
  }
}

export const documentService = new DocumentService()

