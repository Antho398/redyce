/**
 * Client IA centralisé pour le module /src/ia
 * Supporte OpenAI par défaut, extensible pour d'autres providers
 */

import OpenAI from 'openai'
import { env } from '@/config/env'
import { AIResponse, AIPrompt } from '@/types/ai'

class IAClient {
  private openai: OpenAI | null = null

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      })
    }
  }

  /**
   * Génère une réponse à partir d'un prompt
   */
  async generateResponse(
    prompt: AIPrompt,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      tracking?: {
        userId: string
        userEmail?: string
        operation: string
        projectId?: string
        documentId?: string
      }
    }
  ): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

      if (prompt.system) {
        messages.push({
          role: 'system',
          content: prompt.system,
        })
      }

      messages.push({
        role: 'user',
        content: prompt.user,
      })

      const completion = await this.openai.chat.completions.create({
        model: options?.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      })

      const message = completion.choices[0]?.message

      if (!message?.content) {
        throw new Error('No response from AI')
      }

      const result = {
        content: message.content,
        metadata: {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens,
          finishReason: completion.choices[0]?.finish_reason,
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
        },
      }

      // Enregistrer l'usage si les informations sont fournies
      if (options?.tracking && completion.usage) {
        const { UsageTracker } = await import('@/services/usage-tracker')
        UsageTracker.recordUsage(
          options.tracking.userId,
          completion.model,
          completion.usage.prompt_tokens || 0,
          completion.usage.completion_tokens || 0,
          options.tracking.operation,
          {
            userEmail: options.tracking.userEmail,
            projectId: options.tracking.projectId,
            documentId: options.tracking.documentId,
          }
        ).catch((err) => {
          // Ne pas bloquer si le tracking échoue
          console.error('Failed to track usage:', err)
        })
      }

      return result
    } catch (error) {
      console.error('AI generation error:', error)
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Génère une réponse avec format JSON
   */
  async generateJSONResponse<T = any>(
    prompt: AIPrompt,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      tracking?: {
        userId: string
        userEmail?: string
        operation: string
        projectId?: string
        documentId?: string
      }
    }
  ): Promise<T> {
    const response = await this.generateResponse(
      {
        ...prompt,
        user: `${prompt.user}\n\nRéponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.`,
      },
      {
        ...options,
        temperature: options?.temperature ?? 0.3, // Plus bas pour JSON plus cohérent
      }
    )

    try {
      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/) || response.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T
      }
      return JSON.parse(response.content) as T
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      console.error('Response content:', response.content.substring(0, 500))
      throw new Error('Failed to parse AI response as JSON')
    }
  }

  /**
   * Génère des embeddings (pour recherche sémantique future)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })

      return response.data[0]?.embedding || []
    } catch (error) {
      console.error('Embedding generation error:', error)
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Singleton instance
export const iaClient = new IAClient()

