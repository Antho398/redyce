/**
 * Service IA centralisé
 * Orchestre les interactions avec l'IA
 */

import { aiClient } from '@/lib/ai/client'
import { buildChatPrompt, CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts/chat'
import { ChatContext } from '@/types/ai'
import { prisma } from '@/lib/prisma/client'

export class AIService {
  /**
   * Génère une réponse de chat
   */
  async chat(userId: string, message: string, projectId?: string): Promise<string> {
    const context: ChatContext = {
      userId,
      projectId,
    }

    // Si un projet est spécifié, récupérer les documents pertinents
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          documents: {
            where: { status: 'processed' },
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
            take: 5,
          },
        },
      })

      if (project) {
        context.relevantDocuments = project.documents
          .filter((doc) => doc.analyses.length > 0)
          .map((doc) => ({
            id: doc.id,
            name: doc.name,
            content: JSON.stringify(doc.analyses[0]?.result || {}).substring(0, 2000),
          }))
      }
    }

    const prompt = buildChatPrompt(message, {
      projectName: projectId ? undefined : undefined, // À récupérer si besoin
      relevantDocuments: context.relevantDocuments,
    })

    const response = await aiClient.generateResponse({
      system: CHAT_SYSTEM_PROMPT,
      user: prompt,
    })

    // Sauvegarder les messages dans la DB
    await prisma.chatMessage.createMany({
      data: [
        {
          userId,
          projectId: projectId || null,
          role: 'user',
          content: message,
        },
        {
          userId,
          projectId: projectId || null,
          role: 'assistant',
          content: response.content,
        },
      ],
    })

    return response.content
  }
}

export const aiService = new AIService()

