/**
 * Service pour détecter les sections obsolètes (stale)
 * Compare le contexte de génération stocké avec l'état actuel des sources
 */

import { prisma } from '@/lib/prisma/client'
import {
  type GenerationContext,
  computeCompanyProfileHash,
  computeRequirementsHash,
  computeCompanyDocsHash,
  computeQuestionHash,
  compareContexts,
  CHANGE_LABELS,
} from '@/lib/utils/generation-context'

export interface SectionStalenessResult {
  sectionId: string
  isStale: boolean
  wasGeneratedByAI: boolean
  generatedAt?: string
  changes: Array<{
    type: 'companyProfile' | 'requirements' | 'companyDocs' | 'question'
    label: string
  }>
}

export interface MemoireStalenessResult {
  memoireId: string
  sections: SectionStalenessResult[]
  staleSectionsCount: number
  totalGeneratedSections: number
}

export class SectionStalenessService {
  /**
   * Vérifie la fraîcheur de toutes les sections d'un mémoire
   */
  async checkMemoireStaleness(
    userId: string,
    memoireId: string
  ): Promise<MemoireStalenessResult> {
    // Récupérer le mémoire avec ses sections
    const memoire = await prisma.memoire.findUnique({
      where: { id: memoireId },
      include: {
        project: {
          include: {
            client: true,
            requirements: {
              select: { id: true, title: true, description: true, code: true },
            },
          },
        },
        sections: {
          select: {
            id: true,
            question: true,
            generationContextJson: true,
            generatedAt: true,
          },
        },
      },
    })

    if (!memoire || memoire.userId !== userId) {
      return {
        memoireId,
        sections: [],
        staleSectionsCount: 0,
        totalGeneratedSections: 0,
      }
    }

    // Récupérer le contexte actuel (profil client, documents)
    const currentContext = await this.getCurrentContext(userId, memoire.project.id, memoire.project.clientId || undefined)

    // Vérifier chaque section
    const sectionResults: SectionStalenessResult[] = []

    for (const section of memoire.sections) {
      const storedContext = section.generationContextJson as GenerationContext | null

      // Section non générée par IA
      if (!storedContext || !section.generatedAt) {
        sectionResults.push({
          sectionId: section.id,
          isStale: false,
          wasGeneratedByAI: false,
          changes: [],
        })
        continue
      }

      // Calculer le hash actuel de la question
      const currentQuestionHash = computeQuestionHash(section.question)

      // Comparer les contextes
      const comparison = compareContexts(storedContext, {
        companyProfileHash: currentContext.companyProfileHash,
        requirementsHash: currentContext.requirementsHash,
        companyDocsHash: currentContext.companyDocsHash,
        questionHash: currentQuestionHash,
      })

      sectionResults.push({
        sectionId: section.id,
        isStale: comparison.isStale,
        wasGeneratedByAI: true,
        generatedAt: storedContext.generatedAt,
        changes: comparison.changes.map(type => ({
          type,
          label: CHANGE_LABELS[type],
        })),
      })
    }

    return {
      memoireId,
      sections: sectionResults,
      staleSectionsCount: sectionResults.filter(s => s.isStale).length,
      totalGeneratedSections: sectionResults.filter(s => s.wasGeneratedByAI).length,
    }
  }

  /**
   * Vérifie la fraîcheur d'une section spécifique
   */
  async checkSectionStaleness(
    userId: string,
    sectionId: string
  ): Promise<SectionStalenessResult | null> {
    // Récupérer la section avec son mémoire et projet
    const section = await prisma.memoireSection.findUnique({
      where: { id: sectionId },
      include: {
        memoire: {
          include: {
            project: {
              include: {
                client: true,
                requirements: {
                  select: { id: true, title: true, description: true, code: true },
                },
              },
            },
          },
        },
      },
    })

    if (!section || section.memoire.userId !== userId) {
      return null
    }

    const storedContext = section.generationContextJson as GenerationContext | null

    // Section non générée par IA
    if (!storedContext || !section.generatedAt) {
      return {
        sectionId: section.id,
        isStale: false,
        wasGeneratedByAI: false,
        changes: [],
      }
    }

    // Récupérer le contexte actuel
    const currentContext = await this.getCurrentContext(userId, section.memoire.project.id, section.memoire.project.clientId || undefined)
    const currentQuestionHash = computeQuestionHash(section.question)

    // Comparer les contextes
    const comparison = compareContexts(storedContext, {
      companyProfileHash: currentContext.companyProfileHash,
      requirementsHash: currentContext.requirementsHash,
      companyDocsHash: currentContext.companyDocsHash,
      questionHash: currentQuestionHash,
    })

    return {
      sectionId: section.id,
      isStale: comparison.isStale,
      wasGeneratedByAI: true,
      generatedAt: storedContext.generatedAt,
      changes: comparison.changes.map(type => ({
        type,
        label: CHANGE_LABELS[type],
      })),
    }
  }

  /**
   * Récupère le contexte actuel (hashes des sources)
   */
  private async getCurrentContext(
    userId: string,
    projectId: string,
    clientId?: string
  ): Promise<{
    companyProfileHash: string
    requirementsHash: string
    companyDocsHash: string
  }> {
    // Récupérer le profil du client associé au projet
    let clientProfile: Record<string, unknown> | null = null
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      })
      if (client) {
        clientProfile = {
          companyName: client.companyName || client.name || '',
          description: client.description || '',
          activities: client.activities || '',
          workforce: client.workforce || '',
          equipment: client.equipment || '',
          qualitySafety: client.qualitySafety || '',
          references: client.references || '',
          workMethodology: client.workMethodology || '',
          siteOccupied: client.siteOccupied || '',
        }
      }
    }

    // Récupérer les exigences du projet
    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      select: { id: true, title: true, description: true },
    })

    // Récupérer les documents de méthodologie du client
    const methodologyDocs = clientId
      ? await prisma.methodologyDocument.findMany({
          where: { clientId },
          select: { id: true, extractedText: true },
        })
      : []

    return {
      companyProfileHash: computeCompanyProfileHash(clientProfile),
      requirementsHash: computeRequirementsHash(
        requirements.map(r => ({
          id: r.id,
          title: r.title || undefined,
          content: r.description || undefined,
        }))
      ),
      companyDocsHash: computeCompanyDocsHash(
        methodologyDocs.map(d => ({
          id: d.id,
          extractedContent: d.extractedText || undefined,
        }))
      ),
    }
  }
}

export const sectionStalenessService = new SectionStalenessService()
