/**
 * Service de suivi de consommation OpenAI
 * Adapté depuis Ergobuddyconnect pour Redyce
 */

import { prisma } from '@/lib/prisma/client'

export interface UsageRecord {
  id: string
  timestamp: Date
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  operation: string
  userId?: string
  userEmail?: string
  projectId?: string
  documentId?: string
}

export interface UsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  monthlyCost: number
  dailyCost: number
  breakdown: {
    [model: string]: {
      requests: number
      tokens: number
      cost: number
    }
  }
  byOperation?: {
    [operation: string]: {
      requests: number
      tokens: number
      cost: number
    }
  }
  byUser?: {
    [userId: string]: {
      email: string
      requests: number
      tokens: number
      cost: number
    }
  }
  recentOperations?: Array<{
    id: string
    operation: string
    model: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost: number
    createdAt: Date
    projectId?: string | null
    documentId?: string | null
  }>
}

// Prix par token (approximatifs - à mettre à jour selon les tarifs OpenAI)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': {
    input: 0.00015 / 1000, // $0.15 per 1M input tokens
    output: 0.0006 / 1000, // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 0.005 / 1000, // $5.00 per 1M input tokens
    output: 0.015 / 1000, // $15.00 per 1M output tokens
  },
  'gpt-4-turbo-preview': {
    input: 0.01 / 1000, // $10.00 per 1M input tokens
    output: 0.03 / 1000, // $30.00 per 1M output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005 / 1000, // $0.50 per 1M input tokens
    output: 0.0015 / 1000, // $1.50 per 1M output tokens
  },
}

export class UsageTracker {
  static calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Extraire le modèle de base (gpt-4o, gpt-4o-mini, etc.)
    const baseModel = model.split('-').slice(0, 3).join('-') // gpt-4o-mini, gpt-4o, etc.
    const pricing = PRICING[baseModel] || PRICING['gpt-4o-mini']
    return inputTokens * pricing.input + outputTokens * pricing.output
  }

  /**
   * Enregistre une utilisation OpenAI dans la base de données
   */
  static async recordUsage(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    operation: string,
    options?: {
      userEmail?: string
      projectId?: string
      documentId?: string
    }
  ): Promise<void> {
    const cost = this.calculateCost(model, inputTokens, outputTokens)
    const totalTokens = inputTokens + outputTokens

    try {
      await prisma.aIUsage.create({
        data: {
          userId,
          userEmail: options?.userEmail,
          model,
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
          operation,
          projectId: options?.projectId,
          documentId: options?.documentId,
        },
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'usage:', error)
      // On ne bloque pas l'opération en cas d'erreur de tracking
    }
  }

  /**
   * Récupère les statistiques d'utilisation depuis la base de données
   */
  static async getUsageStats(userId?: string): Promise<UsageStats> {
    try {
      const where = userId ? { userId } : {}

      const records = await prisma.aIUsage.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const monthlyRecords = records.filter((r) => r.createdAt >= thisMonth)
      const dailyRecords = records.filter((r) => r.createdAt >= today)

      // Fonction pour arrondir à 6 décimales (évite les erreurs de virgule flottante)
      const roundCost = (cost: number) => Math.round(cost * 1000000) / 1000000

      const totalStats = records.reduce(
        (acc, record) => {
          // Utiliser le coût stocké en DB (déjà calculé lors de l'enregistrement)
          const recordCost = record.cost

          acc.totalRequests++
          acc.totalTokens += record.totalTokens
          acc.totalCost = roundCost(acc.totalCost + recordCost)

          // Par modèle
          if (!acc.breakdown[record.model]) {
            acc.breakdown[record.model] = { requests: 0, tokens: 0, cost: 0 }
          }
          acc.breakdown[record.model].requests++
          acc.breakdown[record.model].tokens += record.totalTokens
          acc.breakdown[record.model].cost = roundCost(acc.breakdown[record.model].cost + recordCost)

          // Par opération
          if (!acc.byOperation) {
            acc.byOperation = {}
          }
          if (!acc.byOperation[record.operation]) {
            acc.byOperation[record.operation] = { requests: 0, tokens: 0, cost: 0 }
          }
          acc.byOperation[record.operation].requests++
          acc.byOperation[record.operation].tokens += record.totalTokens
          acc.byOperation[record.operation].cost = roundCost(acc.byOperation[record.operation].cost + recordCost)

          // Par utilisateur (si pas de filtre userId)
          if (!userId && record.userId) {
            if (!acc.byUser) {
              acc.byUser = {}
            }
            if (!acc.byUser[record.userId]) {
              acc.byUser[record.userId] = {
                email: record.userEmail || record.user.email || 'Inconnu',
                requests: 0,
                tokens: 0,
                cost: 0,
              }
            }
            acc.byUser[record.userId].requests++
            acc.byUser[record.userId].tokens += record.totalTokens
            acc.byUser[record.userId].cost = roundCost(acc.byUser[record.userId].cost + recordCost)
          }

          return acc
        },
        {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          breakdown: {} as { [model: string]: { requests: number; tokens: number; cost: number } },
          byOperation: {} as { [operation: string]: { requests: number; tokens: number; cost: number } },
          byUser: {} as { [userId: string]: { email: string; requests: number; tokens: number; cost: number } },
        }
      )

      // Ajouter les 50 dernières opérations (les plus récentes)
      const recentOperations = records.slice(0, 50).map((record) => ({
        id: record.id,
        operation: record.operation,
        model: record.model,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        cost: record.cost,
        createdAt: record.createdAt,
        projectId: record.projectId,
        documentId: record.documentId,
      }))

      const monthlyCost = monthlyRecords.reduce((sum, record) => sum + record.cost, 0)
      const dailyCost = dailyRecords.reduce((sum, record) => sum + record.cost, 0)

      return {
        ...totalStats,
        monthlyCost,
        dailyCost,
        recentOperations,
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error)
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        monthlyCost: 0,
        dailyCost: 0,
        breakdown: {},
        byOperation: {},
        byUser: {},
        recentOperations: [],
      }
    }
  }

  /**
   * Supprime toutes les données d'utilisation (admin uniquement)
   */
  static async clearUsageData(userId?: string): Promise<void> {
    try {
      const where = userId ? { userId } : {}
      await prisma.aIUsage.deleteMany({ where })
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error)
      throw error
    }
  }
}

// Singleton instance
export const usageTracker = new UsageTracker()

