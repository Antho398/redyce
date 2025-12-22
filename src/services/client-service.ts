/**
 * Service pour la gestion des clients (entreprises tierces)
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

export interface CreateClientInput {
  name: string
  companyName?: string
  description?: string
  activities?: string
  workforce?: string
  equipment?: string
  qualitySafety?: string
  references?: string
}

export interface UpdateClientInput {
  name?: string
  companyName?: string
  description?: string
  activities?: string
  workforce?: string
  equipment?: string
  qualitySafety?: string
  references?: string
}

export interface UpdateClientMethodologyInput {
  writingStyle?: string
  writingTone?: string
  writingGuidelines?: string
  forbiddenWords?: string
  preferredTerms?: string
  websiteUrl?: string
}

export class ClientService {
  /**
   * Récupère tous les clients d'un utilisateur
   */
  async getClients(userId: string) {
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            projects: true,
            methodologyDocuments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return clients
  }

  /**
   * Récupère un client par son ID
   */
  async getClient(clientId: string, userId: string) {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
      include: {
        _count: {
          select: {
            projects: true,
            methodologyDocuments: true,
          },
        },
      },
    })

    if (!client) {
      throw new NotFoundError('Client', clientId)
    }

    return client
  }

  /**
   * Crée un nouveau client
   */
  async createClient(userId: string, data: CreateClientInput) {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundError('User', userId)
    }

    const client = await prisma.client.create({
      data: {
        userId,
        ...data,
      },
    })

    return client
  }

  /**
   * Met à jour un client
   */
  async updateClient(clientId: string, userId: string, data: UpdateClientInput) {
    // Vérifier que le client appartient à l'utilisateur
    const client = await this.getClient(clientId, userId)

    const updated = await prisma.client.update({
      where: { id: clientId },
      data,
    })

    return updated
  }

  /**
   * Met à jour la méthodologie d'un client
   */
  async updateClientMethodology(
    clientId: string,
    userId: string,
    data: UpdateClientMethodologyInput
  ) {
    // Vérifier que le client appartient à l'utilisateur
    await this.getClient(clientId, userId)

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        writingStyle: data.writingStyle,
        writingTone: data.writingTone,
        writingGuidelines: data.writingGuidelines,
        forbiddenWords: data.forbiddenWords,
        preferredTerms: data.preferredTerms,
        websiteUrl: data.websiteUrl,
      },
    })

    return updated
  }

  /**
   * Supprime un client
   */
  async deleteClient(clientId: string, userId: string) {
    // Vérifier que le client appartient à l'utilisateur
    await this.getClient(clientId, userId)

    await prisma.client.delete({
      where: { id: clientId },
    })
  }

  /**
   * Récupère la méthodologie d'un client pour injection dans le prompt IA
   */
  async getClientMethodologyForAI(clientId: string): Promise<string> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return ''
    }

    const parts: string[] = []

    if (client.writingStyle) {
      parts.push(`Style de rédaction : ${client.writingStyle}`)
    }

    if (client.writingTone) {
      parts.push(`Ton : ${client.writingTone}`)
    }

    if (client.writingGuidelines) {
      parts.push(`Consignes spécifiques :\n${client.writingGuidelines}`)
    }

    if (client.forbiddenWords) {
      parts.push(`Mots à éviter : ${client.forbiddenWords}`)
    }

    if (client.preferredTerms) {
      parts.push(`Vocabulaire privilégié : ${client.preferredTerms}`)
    }

    return parts.join('\n\n')
  }
}

export const clientService = new ClientService()
