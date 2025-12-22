/**
 * Client IA centralisé
 * Supporte OpenAI par défaut, extensible pour d'autres providers
 */

import OpenAI from 'openai'
import { env } from '@/config/env'
import { AIResponse, AIPrompt } from '@/types/ai'

class AIClient {
  private openai: OpenAI | null = null

  /**
   * Récupère ou crée le client OpenAI (lazy initialization)
   * Pour supporter le worker standalone qui charge dotenv après l'import
   */
  private getOpenAIClient(): OpenAI {
    if (!this.openai) {
      // Utiliser process.env directement pour supporter le worker standalone
      // qui charge dotenv après l'import des modules
      const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY
      
      // Debug: vérifier pourquoi la clé n'est pas trouvée
      if (!apiKey) {
        console.error('[AIClient] OPENAI_API_KEY not found')
        console.error('[AIClient] process.env.OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'EXISTS' : 'undefined')
        console.error('[AIClient] env.OPENAI_API_KEY:', env.OPENAI_API_KEY ? 'EXISTS' : 'undefined')
        throw new Error('OpenAI API key not configured')
      }
      
      this.openai = new OpenAI({
        apiKey: apiKey.trim(), // Enlever les espaces au cas où
      })
    }
    return this.openai
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
    const openai = this.getOpenAIClient()

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

      const completion = await openai.chat.completions.create({
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
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
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
    const openai = this.getOpenAIClient()

    try {
      const response = await openai.embeddings.create({
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

