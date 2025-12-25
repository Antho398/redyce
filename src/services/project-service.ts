/**
 * Service métier pour la gestion des projets
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { CreateProjectInput, UpdateProjectInput } from '@/lib/utils/validation'
import { ProjectWithDocuments } from '@/types/database'

export class ProjectService {
  /**
   * Crée un nouveau projet
   */
  async createProject(userId: string, data: CreateProjectInput): Promise<ProjectWithDocuments> {
    return await prisma.project.create({
      data: {
        ...data,
        userId,
      },
      include: {
        documents: true,
        _count: {
          select: {
            documents: true,
            memoires: true,
          },
        },
      },
    })
  }

  /**
   * Récupère tous les projets d'un utilisateur
   */
  async getUserProjects(userId: string): Promise<ProjectWithDocuments[]> {
    return await prisma.project.findMany({
      where: { userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            documents: true,
            memoires: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  /**
   * Récupère un projet par ID
   */
  async getProjectById(projectId: string, userId: string): Promise<ProjectWithDocuments> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            documents: true,
            memoires: true,
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return project
  }

  /**
   * Met à jour un projet
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<ProjectWithDocuments> {
    // Vérifier l'accès
    await this.getProjectById(projectId, userId)

    return await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        documents: true,
        _count: {
          select: {
            documents: true,
            memoires: true,
          },
        },
      },
    })
  }

  /**
   * Supprime un projet
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Vérifier l'accès
    await this.getProjectById(projectId, userId)

    await prisma.project.delete({
      where: { id: projectId },
    })
  }
}

export const projectService = new ProjectService()

