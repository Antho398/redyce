/**
 * Service métier pour la génération et gestion de CCTP
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { generateCCTPPipeline, formatCCTPAsText, validateCCTPGeneration } from '@/ia'
import { dpgfService } from './dpgf-service'

export class CCTPService {
  /**
   * Génère un CCTP depuis un DPGF structuré
   */
  async generateCCTPFromDPGF(
    dpgfId: string,
    userId: string,
    options?: {
      userRequirements?: string
      additionalContext?: string
      model?: string
      temperature?: number
    }
  ) {
    // 1. Récupérer le DPGF
    const dpgf = await dpgfService.getDPGFById(dpgfId, userId)

    // 2. Vérifier que le DPGF est validé ou extrait
    if (!['extracted', 'validated'].includes(dpgf.status)) {
      throw new Error('DPGF must be extracted or validated before generating CCTP')
    }

    // 3. Récupérer le projet
    const project = await prisma.project.findUnique({
      where: { id: dpgf.projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', dpgf.projectId)
    }

    // 4. Préparer les données DPGF
    const dpgfData = dpgf.data as any

    // 5. Générer le CCTP via le pipeline IA
    const generationResult = await generateCCTPPipeline({
      projectName: project.name,
      dpgfData: {
        titre: dpgf.title,
        reference: dpgf.reference || undefined,
        dateCreation: dpgf.dateCreation?.toISOString(),
        articles: dpgfData.articles || [],
        materiauxGeneraux: dpgfData.materiauxGeneraux || [],
        normes: dpgfData.normes || [],
        observations: dpgfData.observations,
      },
      userRequirements: options?.userRequirements,
      additionalContext: options?.additionalContext,
      model: options?.model,
      temperature: options?.temperature,
    })

    // 6. Valider le résultat
    const validation = validateCCTPGeneration(generationResult.data)
    if (!validation.valid) {
      console.warn('CCTP generation validation warnings:', validation.warnings)
    }

    // 7. Générer le contenu texte formaté
    const contentText = formatCCTPAsText(generationResult.data)

    // 8. Créer l'enregistrement CCTP en base
    const cctp = await prisma.cCTPGenerated.create({
      data: {
        projectId: dpgf.projectId,
        dpgfId: dpgfId,
        title: `CCTP - ${project.name}`,
        reference: generationResult.data.projet.reference || null,
        content: contentText,
        structure: generationResult.data as any,
        status: 'generated',
        version: 1,
        metadata: {
          validation: {
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
          },
          generation: {
            model: generationResult.metadata?.model,
            tokensUsed: generationResult.metadata?.tokensUsed,
          },
          dpgfSource: {
            id: dpgf.id,
            title: dpgf.title,
            reference: dpgf.reference,
          },
        },
      },
    })

    return cctp
  }

  /**
   * Génère un nouveau CCTP sans DPGF (depuis documents bruts)
   */
  async generateCCTPFromDocuments(
    projectId: string,
    userId: string,
    options?: {
      userRequirements?: string
      additionalContext?: string
      model?: string
      temperature?: number
    }
  ) {
    // Vérifier l'accès au projet
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Récupérer les documents traités du projet
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        status: 'processed',
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

    if (documents.length === 0) {
      throw new Error('No processed documents found in project')
    }

    // Construire un contexte depuis les documents
    const documentsContext = documents
      .map((doc) => {
        const analysis = doc.analyses[0]
        const content = analysis?.result
          ? (analysis.result as any).extractedContent?.text ||
            (analysis.result as any).text ||
            ''
          : ''
        return `${doc.name} (${doc.documentType || 'OTHER'}):\n${content.substring(0, 2000)}`
      })
      .join('\n\n---\n\n')

    // Générer le CCTP (utiliser un DPGF vide comme structure de base)
    const generationResult = await generateCCTPPipeline({
      projectName: project.name,
      dpgfData: {
        titre: project.name,
        articles: [],
        materiauxGeneraux: [],
        normes: [],
      },
      userRequirements: options?.userRequirements,
      additionalContext: `${options?.additionalContext || ''}\n\nDocuments du projet:\n${documentsContext}`,
      model: options?.model,
      temperature: options?.temperature,
    })

    const contentText = formatCCTPAsText(generationResult.data)

    const cctp = await prisma.cCTPGenerated.create({
      data: {
        projectId,
        dpgfId: null,
        title: `CCTP - ${project.name}`,
        reference: generationResult.data.projet.reference || null,
        content: contentText,
        structure: generationResult.data as any,
        status: 'generated',
        version: 1,
        metadata: {
          generatedFrom: 'documents',
          documentsUsed: documents.map((d) => ({ id: d.id, name: d.name })),
        },
      },
    })

    return cctp
  }

  /**
   * Récupère tous les CCTP d'un projet
   */
  async getProjectCCTPs(projectId: string, userId: string) {
    // Vérifier l'accès
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.cCTPGenerated.findMany({
      where: { projectId },
      include: {
        dpgf: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupère un CCTP par ID
   */
  async getCCTPById(cctpId: string, userId: string) {
    const cctp = await prisma.cCTPGenerated.findUnique({
      where: { id: cctpId },
      include: {
        project: true,
        dpgf: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
      },
    })

    if (!cctp) {
      throw new NotFoundError('CCTP', cctpId)
    }

    if (cctp.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this CCTP')
    }

    return cctp
  }

  /**
   * Met à jour un CCTP
   */
  async updateCCTP(
    cctpId: string,
    userId: string,
    data: {
      title?: string
      reference?: string
      content?: string
      structure?: any
      status?: string
    }
  ) {
    // Vérifier l'accès
    await this.getCCTPById(cctpId, userId)

    return await prisma.cCTPGenerated.update({
      where: { id: cctpId },
      data: {
        title: data.title,
        reference: data.reference,
        content: data.content,
        structure: data.structure,
        status: data.status,
      },
    })
  }

  /**
   * Crée une nouvelle version d'un CCTP
   */
  async createNewVersion(cctpId: string, userId: string) {
    const cctp = await this.getCCTPById(cctpId, userId)

    // Si le CCTP a été généré depuis un DPGF, on peut régénérer
    if (cctp.dpgfId) {
      return await this.generateCCTPFromDPGF(cctp.dpgfId, userId)
    }

    // Sinon, créer une nouvelle version manuelle
    const newVersion = await prisma.cctpGenerated.create({
      data: {
        projectId: cctp.projectId,
        dpgfId: cctp.dpgfId,
        title: cctp.title,
        reference: cctp.reference,
        content: cctp.content,
        structure: cctp.structure,
        status: 'draft',
        version: cctp.version + 1,
        metadata: {
          previousVersionId: cctp.id,
          previousVersion: cctp.version,
        },
      },
    })

    return newVersion
  }

  /**
   * Finalise un CCTP (passe le statut à "finalized")
   */
  async finalizeCCTP(cctpId: string, userId: string) {
    const cctp = await this.getCCTPById(cctpId, userId)

    // Valider avant de finaliser
    if (cctp.structure) {
      const validation = validateCCTPGeneration(cctp.structure as any)
      if (!validation.valid) {
        throw new Error(`CCTP validation failed: ${validation.errors.join(', ')}`)
      }
    }

    return await prisma.cCTPGenerated.update({
      where: { id: cctpId },
      data: { status: 'finalized' },
    })
  }

  /**
   * Supprime un CCTP
   */
  async deleteCCTP(cctpId: string, userId: string): Promise<void> {
    // Vérifier l'accès
    await this.getCCTPById(cctpId, userId)

    await prisma.cCTPGenerated.delete({
      where: { id: cctpId },
    })
  }
}

export const cctpService = new CCTPService()

