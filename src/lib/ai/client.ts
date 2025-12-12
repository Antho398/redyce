/**
 * Client IA centralisé
 * Supporte OpenAI par défaut, extensible pour d'autres providers
 */

import OpenAI from 'openai'
import { env } from '@/config/env'
import { AIResponse, AIPrompt } from '@/types/ai'

class AIClient {
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
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens,
      })

      const message = completion.choices[0]?.message

      if (!message?.content) {
        throw new Error('No response from AI')
      }

      return {
        content: message.content,
        metadata: {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens,
          finishReason: completion.choices[0]?.finish_reason,
        },
      }
    } catch (error) {
      console.error('AI generation error:', error)
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
export const aiClient = new AIClient()

