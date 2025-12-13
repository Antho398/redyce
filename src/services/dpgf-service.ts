/**
 * Service métier pour la gestion des DPGF structurés
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { extractDPGFPipeline, validateDPGFExtraction } from '@/ia'
import type { DPGFExtractedData } from '@/ia'

export class DPGFService {
  /**
   * Extrait et crée un DPGF structuré depuis un document
   */
  async extractDPGFFromDocument(
    documentId: string,
    userId: string,
    options?: {
      model?: string
      temperature?: number
    }
  ) {
    // 1. Vérifier que l'utilisateur a accès au document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    // 2. Vérifier que le document est traité
    if (document.status !== 'processed') {
      throw new Error('Document must be processed before DPGF extraction')
    }

    // 3. Récupérer le contenu extrait du document
    const analysis = await prisma.documentAnalysis.findFirst({
      where: {
        documentId,
        analysisType: 'extraction',
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!analysis || !analysis.result) {
      throw new Error('Document extraction not found. Please parse the document first.')
    }

    // 4. Extraire le texte depuis le résultat d'analyse
    const extractedContent = analysis.result as any
    const documentText = extractedContent.extractedContent?.text || extractedContent.text || ''

    if (!documentText) {
      throw new Error('No text content found in document extraction')
    }

    // 5. Récupérer l'email de l'utilisateur pour le tracking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    // 6. Lancer l'extraction DPGF via le pipeline IA
    const extractionResult = await extractDPGFPipeline({
      documentContent: documentText,
      documentType: document.documentType || 'DPGF',
      model: options?.model,
      temperature: options?.temperature,
      tracking: {
        userId,
        userEmail: user?.email,
        operation: 'dpgf_extraction',
        projectId: document.projectId,
        documentId,
      },
    })

    // 7. Valider le résultat
    const validation = validateDPGFExtraction(extractionResult.data)
    if (!validation.valid) {
      console.warn('DPGF extraction validation warnings:', validation.warnings)
      // On continue quand même mais on log les warnings
    }

    // 8. Créer l'enregistrement DPGF en base
    const dpgf = await prisma.dpgfStructured.create({
      data: {
        projectId: document.projectId,
        documentId: documentId,
        title: extractionResult.data.titre,
        reference: extractionResult.data.reference || null,
        dateCreation: extractionResult.data.dateCreation
          ? new Date(extractionResult.data.dateCreation)
          : null,
        data: extractionResult.data as any,
        status: 'extracted',
        confidence: extractionResult.confidence,
        metadata: {
          validation: {
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
          },
          extraction: {
            model: extractionResult.metadata?.model,
            tokensUsed: extractionResult.metadata?.tokensUsed,
          },
        },
      },
    })

    return dpgf
  }

  /**
   * Récupère tous les DPGF d'un projet
   */
  async getProjectDPGFs(projectId: string, userId: string) {
    // Vérifier l'accès
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.dpgfStructured.findMany({
      where: { projectId },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            fileName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupère un DPGF par ID
   */
  async getDPGFById(dpgfId: string, userId: string) {
    const dpgf = await prisma.dpgfStructured.findUnique({
      where: { id: dpgfId },
      include: {
        project: true,
        document: {
          select: {
            id: true,
            name: true,
            fileName: true,
          },
        },
      },
    })

    if (!dpgf) {
      throw new NotFoundError('DPGF', dpgfId)
    }

    if (dpgf.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this DPGF')
    }

    return dpgf
  }

  /**
   * Met à jour un DPGF
   */
  async updateDPGF(
    dpgfId: string,
    userId: string,
    data: {
      title?: string
      reference?: string
      data?: DPGFExtractedData
      status?: string
    }
  ) {
    // Vérifier l'accès
    await this.getDPGFById(dpgfId, userId)

    // Valider si data est fourni
    if (data.data) {
      const validation = validateDPGFExtraction(data.data)
      if (!validation.valid) {
        throw new Error(`Invalid DPGF data: ${validation.errors.join(', ')}`)
      }
    }

    return await prisma.dpgfStructured.update({
      where: { id: dpgfId },
      data: {
        title: data.title,
        reference: data.reference,
        data: data.data as any,
        status: data.status,
      },
    })
  }

  /**
   * Supprime un DPGF
   */
  async deleteDPGF(dpgfId: string, userId: string): Promise<void> {
    // Vérifier l'accès
    await this.getDPGFById(dpgfId, userId)

    await prisma.dpgfStructured.delete({
      where: { id: dpgfId },
    })
  }

  /**
   * Valide un DPGF structuré
   */
  async validateDPGF(dpgfId: string, userId: string) {
    const dpgf = await this.getDPGFById(dpgfId, userId)

    const validation = validateDPGFExtraction(dpgf.data as any)

    // Mettre à jour le statut si validé
    if (validation.valid && validation.errors.length === 0) {
      await prisma.dpgfStructured.update({
        where: { id: dpgfId },
        data: { status: 'validated' },
      })
    }

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }
}

export const dpgfService = new DPGFService()

