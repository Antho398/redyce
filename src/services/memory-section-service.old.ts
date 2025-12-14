/**
 * Service métier pour la gestion des sections mémoire et réponses
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { aiClient } from '@/lib/ai/client'
import { usageTracker } from '@/services/usage-tracker'
import { documentService } from './document-service'
import { dpgfService } from './dpgf-service'
import { cctpService } from './cctp-service'

export class MemorySectionService {
  /**
   * Récupère toutes les sections d'un projet
   */
  async getProjectSections(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    const sections = await prisma.memorySection.findMany({
      where: { projectId },
      include: {
        answer: {
          include: {
            citations: {
              include: {
                document: true,
              },
            },
          },
        },
        requirementLinks: {
          include: {
            requirement: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return sections
  }

  /**
   * Récupère une section par ID
   */
  async getSectionById(sectionId: string, userId: string) {
    const section = await prisma.memorySection.findUnique({
      where: { id: sectionId },
      include: {
        project: true,
        answer: {
          include: {
            citations: {
              include: {
                document: true,
              },
            },
          },
        },
        requirementLinks: {
          include: {
            requirement: true,
          },
        },
      },
    })

    if (!section) {
      throw new NotFoundError('MemorySection', sectionId)
    }

    if (section.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this section')
    }

    return section
  }

  /**
   * Génère une réponse pour une section
   */
  async generateSectionAnswer(
    sectionId: string,
    userId: string,
    options?: {
      userContext?: string
      model?: string
      temperature?: number
    }
  ) {
    const section = await this.getSectionById(sectionId, userId)

    // Vérifier que le document du template est analysé
    const template = await prisma.memoryTemplate.findUnique({
      where: { id: section.templateId },
      include: { document: true },
    })

    if (!template || template.status !== 'parsed') {
      throw new Error('Le template n\'est pas encore analysé. Analysez d\'abord le template.')
    }

    // Mettre à jour le statut de la section
    await prisma.memorySection.update({
      where: { id: sectionId },
      data: { status: 'generating' },
    })

    try {
      // Récupérer le contexte du projet (documents, DPGF, CCTP)
      const context = await this.buildProjectContext(section.projectId, userId)

      // Générer la réponse avec l'IA
      const answerContent = await this.generateAnswerWithAI(
        section,
        context,
        options?.userContext || '',
        userId,
        options?.model,
        options?.temperature
      )

      // Créer ou mettre à jour la réponse
      const answer = await prisma.memoryAnswer.upsert({
        where: { sectionId },
        create: {
          sectionId,
          content: answerContent.content,
          status: 'completed',
          generatedAt: new Date(),
          metadata: {
            model: options?.model || 'gpt-4o-mini',
            citations: answerContent.citations || [],
          },
        },
        update: {
          content: answerContent.content,
          status: 'completed',
          generatedAt: new Date(),
          metadata: {
            model: options?.model || 'gpt-4o-mini',
            citations: answerContent.citations || [],
          },
        },
      })

      // Créer les citations si nécessaire
      if (answerContent.citations && answerContent.citations.length > 0) {
        for (const citation of answerContent.citations) {
          await prisma.citation.create({
            data: {
              answerId: answer.id,
              documentId: citation.documentId,
              excerpt: citation.excerpt,
              pageNumber: citation.pageNumber || null,
            },
          })
        }
      }

      // Mettre à jour le statut de la section
      await prisma.memorySection.update({
        where: { id: sectionId },
        data: { status: 'completed' },
      })

      return answer
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      await prisma.memorySection.update({
        where: { id: sectionId },
        data: { status: 'pending' },
      })

      throw error
    }
  }

  /**
   * Construit le contexte du projet (documents, DPGF, CCTP)
   */
  private async buildProjectContext(projectId: string, userId: string) {
    // Récupérer les documents analysés
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        status: 'processed',
      },
      include: {
        analyses: {
          where: {
            status: 'completed',
            analysisType: 'extraction',
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Récupérer les DPGF
    const dpgfs = await prisma.dPGFStructured.findMany({
      where: {
        projectId,
        status: 'validated',
      },
    })

    // Récupérer les CCTP
    const cctps = await prisma.cCTPGenerated.findMany({
      where: {
        projectId,
        status: { in: ['generated', 'finalized'] },
      },
    })

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.documentType,
        content: doc.analyses[0]?.result
          ? JSON.stringify(doc.analyses[0].result).substring(0, 2000)
          : '',
      })),
      dpgfs: dpgfs.map((dpgf) => ({
        id: dpgf.id,
        title: dpgf.title,
        data: dpgf.data,
      })),
      cctps: cctps.map((cctp) => ({
        id: cctp.id,
        title: cctp.title,
        content: cctp.content.substring(0, 2000),
      })),
    }
  }

  /**
   * Génère une réponse avec l'IA
   */
  private async generateAnswerWithAI(
    section: any,
    context: any,
    userContext: string,
    userId: string,
    model?: string,
    temperature?: number
  ) {
    const prompt = `Tu es un assistant expert en rédaction de mémoires techniques pour le bâtiment.

Contexte du projet:
${JSON.stringify(context, null, 2)}

Section à remplir:
- Titre: ${section.title}
${section.question ? `- Question: ${section.question}` : ''}
${section.description ? `- Description: ${section.description}` : ''}

${userContext ? `Contexte utilisateur: ${userContext}` : ''}

Rédige une réponse complète et professionnelle pour cette section. Utilise les documents techniques du projet (DPGF, CCTP, documents sources) comme références.

Réponse:`

    const response = await aiClient.generateResponse(
      {
        system:
          'Tu es un expert en rédaction de mémoires techniques. Tu rédiges des réponses précises, professionnelles et basées sur les documents techniques fournis.',
        user: prompt,
      },
      {
        model: model || 'gpt-4o-mini',
        temperature: temperature ?? 0.7,
        maxTokens: 2000,
      }
    )

    // Tracker l'usage
    await usageTracker.trackUsage({
      userId,
      model: model || 'gpt-4o-mini',
      inputTokens: response.metadata?.inputTokens || 0,
      outputTokens: response.metadata?.outputTokens || 0,
      operation: 'memory_section_generate',
    })

    return {
      content: response.content,
      citations: [], // TODO: Extraire les citations si nécessaire
    }
  }

  /**
   * Met à jour une réponse
   */
  async updateAnswer(sectionId: string, content: string, userId: string) {
    const section = await this.getSectionById(sectionId, userId)

    const answer = await prisma.memoryAnswer.upsert({
      where: { sectionId },
      create: {
        sectionId,
        content,
        status: 'draft',
      },
      update: {
        content,
        status: 'draft',
      },
    })

    return answer
  }

  /**
   * Génère toutes les réponses d'un projet
   */
  async generateAllAnswers(projectId: string, userId: string) {
    const sections = await this.getProjectSections(projectId, userId)

    const results = []
    for (const section of sections) {
      if (section.status !== 'completed') {
        try {
          const answer = await this.generateSectionAnswer(section.id, userId)
          results.push({ sectionId: section.id, success: true, answer })
        } catch (error) {
          results.push({
            sectionId: section.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return results
  }
}

export const memorySectionService = new MemorySectionService()

