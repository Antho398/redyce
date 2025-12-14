/**
 * Service métier pour la gestion des sections mémoire et réponses
 * Version mise à jour selon spécifications
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

export class MemorySectionService {
  /**
   * Récupère toutes les sections d'un projet avec statut des réponses
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
        answer: true,
      },
      orderBy: { order: 'asc' },
    })

    return sections.map((section) => ({
      id: section.id,
      order: section.order,
      title: section.title,
      path: section.path,
      required: section.required,
      answer: section.answer
        ? {
            id: section.answer.id,
            contentHtml: section.answer.contentHtml,
            status: section.answer.status,
            preview: section.answer.contentHtml.substring(0, 100),
          }
        : null,
    }))
  }

  /**
   * Récupère une section par ID avec détail
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
   * Met à jour une réponse de section (autosave)
   */
  async updateAnswer(
    sectionId: string,
    contentHtml: string,
    status?: string,
    userId?: string
  ) {
    const section = await prisma.memorySection.findUnique({
      where: { id: sectionId },
      include: { project: true },
    })

    if (!section) {
      throw new NotFoundError('MemorySection', sectionId)
    }

    // Vérifier l'accès si userId fourni
    if (userId && section.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this section')
    }

    const answer = await prisma.memoryAnswer.upsert({
      where: { sectionId },
      create: {
        projectId: section.projectId,
        sectionId,
        contentHtml,
        status: status || 'DRAFT',
      },
      update: {
        contentHtml,
        status: status || 'DRAFT',
        updatedAt: new Date(),
      },
    })

    return answer
  }

  /**
   * Génère une réponse pour une section (stub pour l'instant)
   */
  async generateSectionAnswer(sectionId: string, userId: string) {
    const section = await this.getSectionById(sectionId, userId)

    // Stub: retourner un texte placeholder
    const placeholderContent = `<p>Cette section nécessite une réponse pour: <strong>${section.title}</strong></p>
<p>Le contenu sera généré automatiquement par l'IA dans une prochaine version.</p>`

    const answer = await prisma.memoryAnswer.upsert({
      where: { sectionId },
      create: {
        projectId: section.projectId,
        sectionId,
        contentHtml: placeholderContent,
        status: 'DRAFT',
      },
      update: {
        contentHtml: placeholderContent,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    })

    return answer
  }
}

export const memorySectionService = new MemorySectionService()

