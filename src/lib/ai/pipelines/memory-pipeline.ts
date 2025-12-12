/**
 * Pipeline de génération de mémoire
 * Orchestre les différentes étapes de génération
 */

import { aiClient } from '../client'
import { MEMORY_GENERATION_SYSTEM_PROMPT, buildMemoryGenerationPrompt } from '../prompts/memory-generation'
import { MemoryGenerationContext } from '@/types/ai'
import { prisma } from '@/lib/prisma/client'

export interface MemoryPipelineOptions {
  projectId: string
  title: string
  userRequirements?: string
}

export async function generateMemoryPipeline(options: MemoryPipelineOptions): Promise<string> {
  // 1. Récupérer le projet et ses documents
  const project = await prisma.project.findUnique({
    where: { id: options.projectId },
    include: {
      documents: {
        where: {
          status: 'processed',
        },
        include: {
          analyses: {
            where: {
              status: 'completed',
              analysisType: 'extraction',
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // 2. Préparer le contexte pour la génération
  const documents = project.documents.map((doc) => ({
    name: doc.name,
    type: doc.documentType || 'OTHER',
    summary: doc.analyses[0]?.result
      ? JSON.stringify(doc.analyses[0].result).substring(0, 500)
      : undefined,
  }))

  // 3. Construire le prompt
  const prompt = buildMemoryGenerationPrompt({
    projectName: project.name,
    documents,
    userRequirements: options.userRequirements,
  })

  // 4. Générer le mémoire avec l'IA
  const response = await aiClient.generateResponse(
    {
      system: MEMORY_GENERATION_SYSTEM_PROMPT,
      user: prompt,
    },
    {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4000,
    }
  )

  return response.content
}

