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

    // Récupérer le contexte actuel (profil entreprise, documents)
    const currentContext = await this.getCurrentContext(userId, memoire.project.id)

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
    const currentContext = await this.getCurrentContext(userId, section.memoire.project.id)
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
    projectId: string
  ): Promise<{
    companyProfileHash: string
    requirementsHash: string
    companyDocsHash: string
  }> {
    // Récupérer le profil entreprise
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
    })

    // Récupérer les exigences du projet
    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      select: { id: true, title: true, description: true },
    })

    // Récupérer les documents de méthodologie (MethodologyDocument)
    const methodologyDocs = await prisma.methodologyDocument.findMany({
      where: { userId },
      select: { id: true, extractedText: true },
    })

    return {
      companyProfileHash: computeCompanyProfileHash(
        companyProfile ? (companyProfile as unknown as Record<string, unknown>) : null
      ),
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
