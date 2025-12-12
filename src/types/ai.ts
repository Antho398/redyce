/**
 * Types pour les interactions avec l'IA
 */

export interface AIPrompt {
  system?: string
  user: string
  context?: Record<string, unknown>
}

export interface AIResponse {
  content: string
  metadata?: {
    model?: string
    tokensUsed?: number
    finishReason?: string
  }
}

export interface MemoryGenerationContext {
  projectId: string
  documents: Array<{
    id: string
    name: string
    type: string
    extractedContent?: string
  }>
  previousMemories?: Array<{
    id: string
    title: string
    version: number
  }>
  userRequirements?: string
}

export interface DocumentAnalysisPrompt {
  documentContent: string
  documentType: string
  analysisType: 'extraction' | 'summary' | 'qa' | 'full'
  questions?: string[]
}

export interface ChatContext {
  projectId?: string
  userId: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  relevantDocuments?: Array<{
    id: string
    content: string
  }>
}

