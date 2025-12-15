/**
 * Service pour la gestion des versions de mémoires techniques
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/lib/utils/errors'

export class MemoireVersionService {
  /**
   * Crée une nouvelle version d'un mémoire
   * Clone le mémoire et toutes ses sections, incrémente le numéro de version, et freeze la version précédente
   */
  async createNewVersion(memoireId: string, userId: string): Promise<any> {
    // Récupérer le mémoire actuel
    const currentMemo = await prisma.memoire.findUnique({
      where: { id: memoireId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!currentMemo) {
      throw new NotFoundError('Memoire', memoireId)
    }

    if (currentMemo.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    if (currentMemo.isFrozen) {
      throw new ValidationError('Cannot create new version from a frozen memo')
    }

    // Freeze la version actuelle
    await prisma.memoire.update({
      where: { id: memoireId },
      data: { isFrozen: true },
    })

    // Créer la nouvelle version
    const newVersion = await prisma.memoire.create({
      data: {
        projectId: currentMemo.projectId,
        userId: currentMemo.userId,
        title: currentMemo.title,
        status: 'DRAFT', // Nouvelle version commence en DRAFT
        templateDocumentId: currentMemo.templateDocumentId,
        contentJson: currentMemo.contentJson,
        contentText: currentMemo.contentText,
        versionNumber: currentMemo.versionNumber + 1,
        parentMemoireId: currentMemo.id,
        isFrozen: false,
        metadata: currentMemo.metadata,
      },
    })

    // Cloner toutes les sections
    await prisma.memoireSection.createMany({
      data: currentMemo.sections.map((section) => ({
        memoireId: newVersion.id,
        title: section.title,
        order: section.order,
        question: section.question,
        status: section.status,
        content: section.content,
        sourceRequirementIds: section.sourceRequirementIds,
      })),
    })

    // Récupérer la nouvelle version avec ses sections
    const newVersionWithSections = await prisma.memoire.findUnique({
      where: { id: newVersion.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        parentMemoire: {
          select: {
            id: true,
            versionNumber: true,
          },
        },
      },
    })

    return newVersionWithSections
  }

  /**
   * Récupère l'historique des versions d'un mémoire
   */
  async getVersionHistory(memoireId: string, userId: string): Promise<any[]> {
    // Récupérer le mémoire pour vérifier l'accès
    const memoire = await prisma.memoire.findUnique({
      where: { id: memoireId },
    })

    if (!memoire) {
      throw new NotFoundError('Memoire', memoireId)
    }

    if (memoire.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    // Trouver le mémoire racine (le plus ancien)
    let rootMemo = memoire
    while (rootMemo.parentMemoireId) {
      const parent = await prisma.memoire.findUnique({
        where: { id: rootMemo.parentMemoireId },
      })
      if (!parent) break
      rootMemo = parent
    }

    // Récupérer toutes les versions (du plus ancien au plus récent)
    const allVersions: any[] = []
    let current: any = rootMemo

    while (current) {
      const version = await prisma.memoire.findUnique({
        where: { id: current.id },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
        },
      })
      if (version) {
        allVersions.push(version)
      }

      // Trouver la version suivante
      const nextVersion = await prisma.memoire.findFirst({
        where: { parentMemoireId: current.id },
        orderBy: { versionNumber: 'asc' },
      })
      current = nextVersion || null
    }

    return allVersions.sort((a, b) => a.versionNumber - b.versionNumber)
  }

  /**
   * Compare deux versions d'un mémoire
   * Retourne une comparaison section par section avec indicateur Inchangé/Modifié
   */
  async compareVersions(memoireId1: string, memoireId2: string, userId: string): Promise<any> {
    // Vérifier que les deux mémoires existent et appartiennent à l'utilisateur
    const [memo1, memo2] = await Promise.all([
      prisma.memoire.findUnique({
        where: { id: memoireId1 },
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.memoire.findUnique({
        where: { id: memoireId2 },
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      }),
    ])

    if (!memo1 || !memo2) {
      throw new NotFoundError('Memoire', memoireId1 || memoireId2)
    }

    if (memo1.userId !== userId || memo2.userId !== userId) {
      throw new UnauthorizedError('You do not have access to these memos')
    }

    // Comparer section par section
    const comparison = {
      version1: {
        id: memo1.id,
        versionNumber: memo1.versionNumber,
        title: memo1.title,
      },
      version2: {
        id: memo2.id,
        versionNumber: memo2.versionNumber,
        title: memo2.title,
      },
      sections: [] as any[],
    }

    // Créer un map des sections par order
    const sections1Map = new Map(memo1.sections.map((s) => [s.order, s]))
    const sections2Map = new Map(memo2.sections.map((s) => [s.order, s]))

    // Récupérer tous les ordres uniques
    const allOrders = new Set([
      ...memo1.sections.map((s) => s.order),
      ...memo2.sections.map((s) => s.order),
    ])

    // Comparer chaque section
    for (const order of Array.from(allOrders).sort((a, b) => a - b)) {
      const section1 = sections1Map.get(order)
      const section2 = sections2Map.get(order)

      const content1 = section1?.content || ''
      const content2 = section2?.content || ''

      // Comparaison simple : contenu identique ou différent
      const isModified = content1.trim() !== content2.trim()

      comparison.sections.push({
        order,
        title: section1?.title || section2?.title || `Section ${order}`,
        question: section1?.question || section2?.question || null,
        status: isModified ? 'MODIFIED' : 'UNCHANGED',
        version1: {
          content: content1,
          status: section1?.status || null,
        },
        version2: {
          content: content2,
          status: section2?.status || null,
        },
      })
    }

    return comparison
  }
}

export const memoireVersionService = new MemoireVersionService()

