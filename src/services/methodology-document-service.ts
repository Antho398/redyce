/**
 * Service métier pour la gestion des documents méthodologie
 * Documents de référence : mémoires techniques passés, exemples de réponses, guides de style
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'

export type MethodologyDocumentType = 'REFERENCE_MEMO' | 'EXAMPLE_ANSWER' | 'STYLE_GUIDE'

export interface CreateMethodologyDocumentInput {
  userId: string
  clientId: string
  name: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  documentType: MethodologyDocumentType
}

export class MethodologyDocumentService {
  /**
   * Crée un document méthodologie et extrait son texte
   */
  async createDocument(input: CreateMethodologyDocumentInput) {
    // Créer le document lié au client
    const document = await prisma.methodologyDocument.create({
      data: {
        userId: input.userId,
        clientId: input.clientId,
        name: input.name,
        fileName: input.fileName,
        filePath: input.filePath,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        documentType: input.documentType,
      },
    })

    // Extraire le texte en arrière-plan (non bloquant)
    setImmediate(async () => {
      try {
        const buffer = await fileStorage.readFile(input.filePath)
        const processor = new DocumentProcessor()
        const parsed = await processor.processDocument(buffer, input.mimeType, 'AUTRE')

        const extractedText = parsed.extractedContent?.text || ''

        // Limiter à 15000 caractères pour optimiser les tokens
        const limitedText = extractedText.substring(0, 15000)

        await prisma.methodologyDocument.update({
          where: { id: document.id },
          data: { extractedText: limitedText },
        })

        console.log(`[MethodologyDocument] Texte extrait pour ${document.name}: ${limitedText.length} caractères`)
      } catch (error) {
        console.error(`[MethodologyDocument] Erreur extraction texte pour ${document.id}:`, error)
      }
    })

    return document
  }

  /**
   * Récupère tous les documents méthodologie d'un utilisateur
   */
  async getUserDocuments(userId: string) {
    const documents = await prisma.methodologyDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return documents
  }

  /**
   * Récupère tous les documents méthodologie d'un client
   */
  async getClientDocuments(clientId: string, userId: string) {
    const documents = await prisma.methodologyDocument.findMany({
      where: {
        clientId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return documents
  }

  /**
   * Récupère un document méthodologie par ID
   */
  async getDocument(documentId: string, userId: string) {
    const document = await prisma.methodologyDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new NotFoundError('MethodologyDocument', documentId)
    }

    if (document.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    return document
  }

  /**
   * Supprime un document méthodologie
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.getDocument(documentId, userId)

    // Supprimer le fichier du système de fichiers
    try {
      await fileStorage.deleteFile(document.filePath)
    } catch (error) {
      console.warn(`Failed to delete file for methodology document ${documentId}:`, error)
    }

    // Supprimer l'enregistrement en DB
    await prisma.methodologyDocument.delete({
      where: { id: documentId },
    })

    return document
  }

  /**
   * Récupère les extraits de texte pour l'injection dans le prompt IA
   * Limite à 10000 caractères total pour tous les documents
   */
  async getDocumentsForAIContext(userId: string): Promise<string> {
    const documents = await prisma.methodologyDocument.findMany({
      where: {
        userId,
        extractedText: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // Limiter à 5 documents max
    })

    if (documents.length === 0) {
      return ''
    }

    const MAX_TOTAL_LENGTH = 10000
    let totalLength = 0
    const extracts: string[] = []

    for (const doc of documents) {
      if (!doc.extractedText) continue

      const remaining = MAX_TOTAL_LENGTH - totalLength
      if (remaining <= 0) break

      const limitedExtract = doc.extractedText.substring(0, Math.min(2000, remaining))

      extracts.push(`
## Document de référence : ${doc.name} (${doc.documentType})
${limitedExtract}
${limitedExtract.length < doc.extractedText.length ? '[... contenu tronqué ...]' : ''}
`)

      totalLength += limitedExtract.length
    }

    return extracts.join('\n\n')
  }

  /**
   * Récupère les extraits de texte d'un client pour l'injection dans le prompt IA
   * Limite à 10000 caractères total pour tous les documents
   */
  async getClientDocumentsForAIContext(clientId: string): Promise<string> {
    const documents = await prisma.methodologyDocument.findMany({
      where: {
        clientId,
        extractedText: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // Limiter à 5 documents max
    })

    if (documents.length === 0) {
      return ''
    }

    const MAX_TOTAL_LENGTH = 10000
    let totalLength = 0
    const extracts: string[] = []

    for (const doc of documents) {
      if (!doc.extractedText) continue

      const remaining = MAX_TOTAL_LENGTH - totalLength
      if (remaining <= 0) break

      const limitedExtract = doc.extractedText.substring(0, Math.min(2000, remaining))

      extracts.push(`
## Document de référence : ${doc.name} (${doc.documentType})
${limitedExtract}
${limitedExtract.length < doc.extractedText.length ? '[... contenu tronqué ...]' : ''}
`)

      totalLength += limitedExtract.length
    }

    return extracts.join('\n\n')
  }
}

export const methodologyDocumentService = new MethodologyDocumentService()
