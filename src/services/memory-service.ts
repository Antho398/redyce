/**
 * Service métier pour la génération de mémoires
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { generateMemoryPipeline } from '@/lib/ai/pipelines/memory-pipeline'
import { CreateMemoryInput, UpdateMemoryInput } from '@/lib/utils/validation'
import { MEMORY_STATUS } from '@/config/constants'

export class MemoryService {
  /**
   * Crée un nouveau mémoire
   */
  async createMemory(userId: string, data: CreateMemoryInput) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', data.projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.memory.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        status: MEMORY_STATUS.DRAFT,
        content: '',
      },
    })
  }

  /**
   * Génère le contenu d'un mémoire avec l'IA
   */
  async generateMemory(memoryId: string, userId: string, userRequirements?: string) {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: { project: true },
    })

    if (!memory) {
      throw new NotFoundError('Memory', memoryId)
    }

    if (memory.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memory')
    }

    // Mettre à jour le statut
    await prisma.memory.update({
      where: { id: memoryId },
      data: { status: MEMORY_STATUS.GENERATING },
    })

    try {
      // Générer le contenu
      const content = await generateMemoryPipeline({
        projectId: memory.projectId,
        title: memory.title,
        userRequirements,
        userId,
      })

      // Mettre à jour le mémoire
      const updated = await prisma.memory.update({
        where: { id: memoryId },
        data: {
          status: MEMORY_STATUS.COMPLETED,
          content,
          version: memory.version + 1,
        },
      })

      return updated
    } catch (error) {
      await prisma.memory.update({
        where: { id: memoryId },
        data: {
          status: MEMORY_STATUS.ERROR,
        },
      })
      throw error
    }
  }

  /**
   * Récupère tous les mémoires d'un projet
   */
  async getProjectMemories(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    return await prisma.memory.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  /**
   * Récupère un mémoire par ID
   */
  async getMemoryById(memoryId: string, userId: string) {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: { project: true },
    })

    if (!memory) {
      throw new NotFoundError('Memory', memoryId)
    }

    if (memory.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memory')
    }

    return memory
  }

  /**
   * Met à jour un mémoire
   */
  async updateMemory(memoryId: string, userId: string, data: UpdateMemoryInput) {
    await this.getMemoryById(memoryId, userId)

    return await prisma.memory.update({
      where: { id: memoryId },
      data,
    })
  }

  /**
   * Supprime un mémoire
   */
  async deleteMemory(memoryId: string, userId: string): Promise<void> {
    await this.getMemoryById(memoryId, userId)

    await prisma.memory.delete({
      where: { id: memoryId },
    })
  }
}

export const memoryService = new MemoryService()

