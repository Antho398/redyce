/**
 * Service métier pour la gestion des mémoires techniques
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { parseDOCXTemplate, parsePDFTemplate } from '@/services/memory-template-parser'

export type TechnicalMemoStatus = 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'EXPORTED'

export interface CreateTechnicalMemoInput {
  projectId: string
  templateDocumentId?: string // Optionnel : si non fourni, utilise le premier MODELE_MEMOIRE du projet
  title: string
}

export interface UpdateTechnicalMemoInput {
  title?: string
  status?: TechnicalMemoStatus
  contentJson?: any
  contentText?: string
}

export class TechnicalMemoService {
  /**
   * Crée un nouveau mémoire technique
   */
  async createMemo(userId: string, data: CreateTechnicalMemoInput) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    // Vérifier que le modèle memoire existe
    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    // Vérifier que le projet existe et appartient à l'utilisateur
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', data.projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // GARDE-FOU : Vérifier qu'un document MODELE_MEMOIRE existe pour ce projet
    const templateExists = await prisma.document.findFirst({
      where: {
        projectId: data.projectId,
        documentType: 'MODELE_MEMOIRE',
      },
    })

    if (!templateExists) {
      throw new Error(
        'Aucun modèle de mémoire (MODELE_MEMOIRE) trouvé pour ce projet. ' +
        'Veuillez d\'abord uploader un document de type MODELE_MEMOIRE dans ce projet.'
      )
    }

    // Si templateDocumentId est fourni, vérifier qu'il existe et appartient au projet
    let template
    if (data.templateDocumentId) {
      template = await prisma.document.findUnique({
        where: { id: data.templateDocumentId },
      })

      if (!template) {
        throw new NotFoundError('Document', data.templateDocumentId)
      }

      if (template.projectId !== data.projectId) {
        throw new Error('Template document does not belong to this project')
      }

      // Vérifier que le document est bien de type MODELE_MEMOIRE
      if (template.documentType !== 'MODELE_MEMOIRE') {
        throw new Error(
          `Le document sélectionné n'est pas de type MODELE_MEMOIRE (type actuel: ${template.documentType})`
        )
      }
    } else {
      // Si aucun templateDocumentId n'est fourni, utiliser le premier MODELE_MEMOIRE du projet
      template = templateExists
    }

    // Créer le mémoire
    const memo = await prisma.memoire.create({
      data: {
        projectId: data.projectId,
        userId,
        title: data.title,
        templateDocumentId: template.id,
        status: 'DRAFT',
        contentJson: null,
        contentText: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            fileName: true,
            mimeType: true,
          },
        },
      },
    })

    // Parser le template et créer les sections
    try {
      const buffer = await fileStorage.readFile(template.filePath)
      let sections: Array<{
        order: number
        title: string
        question?: string
        path?: string
      }> = []

      // Parser selon le type de fichier
      if (template.mimeType.includes('word') || template.mimeType.includes('docx')) {
        const extracted = await parseDOCXTemplate(buffer)
        sections = extracted.map((s) => ({
          order: s.order,
          title: s.title,
          question: s.title.includes('?') ? s.title : undefined,
          path: s.path,
        }))
      } else if (template.mimeType.includes('pdf')) {
        const extracted = await parsePDFTemplate(buffer)
        sections = extracted.map((s) => ({
          order: s.order,
          title: s.title,
          question: s.title.includes('?') ? s.title : undefined,
          path: s.path,
        }))
      }

      // Si aucune section trouvée, utiliser des sections par défaut
      if (sections.length === 0) {
        console.warn('No sections extracted from template, using default sections')
        sections = [
          {
            order: 1,
            title: 'Introduction',
            question: 'Décrivez le contexte et les objectifs du projet',
          },
          {
            order: 2,
            title: 'Présentation de l\'entreprise',
            question: 'Présentez votre entreprise et ses compétences',
          },
          {
            order: 3,
            title: 'Compréhension du projet',
            question: 'Exposez votre compréhension du projet et des enjeux',
          },
          {
            order: 4,
            title: 'Méthodologie',
            question: 'Décrivez votre méthodologie de travail',
          },
          {
            order: 5,
            title: 'Planning et organisation',
            question: 'Présentez votre planning et l\'organisation du chantier',
          },
          {
            order: 6,
            title: 'Moyens humains et matériels',
            question: 'Détaillez les moyens humains et matériels mobilisés',
          },
          {
            order: 7,
            title: 'Qualité et sécurité',
            question: 'Exposez vos démarches qualité et sécurité',
          },
          {
            order: 8,
            title: 'Conclusion',
            question: 'Concluez et mettez en avant vos atouts',
          },
        ]
      }

      // Créer les sections en base
      await prisma.memoireSection.createMany({
        data: sections.map((s) => ({
          memoireId: memo.id,
          title: s.title,
          order: s.order,
          question: s.question || null,
          status: 'DRAFT',
          content: null,
          sourceRequirementIds: [],
        })),
      })
    } catch (error) {
      console.error('Error parsing template and creating sections:', error)
      // Ne pas échouer la création du mémoire si le parsing échoue
      // Les sections pourront être créées manuellement ou re-parsées plus tard
    }

    return memo
  }

  /**
   * Récupère tous les mémoires de l'utilisateur avec filtres
   */
  async getUserMemos(
    userId: string,
    filters?: {
      projectId?: string
      status?: TechnicalMemoStatus
      search?: string
    }
  ) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    const where: any = {
      userId,
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { contentText: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const memos = await prisma.memoire.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return memos
  }

  /**
   * Récupère un mémoire par ID
   */
  async getMemoById(memoId: string, userId: string) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    const memo = await prisma.memoire.findUnique({
      where: { id: memoId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            fileName: true,
          },
        },
      },
    })

    if (!memo) {
      throw new NotFoundError('TechnicalMemo', memoId)
    }

    if (memo.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    return memo
  }

  /**
   * Met à jour un mémoire
   */
  async updateMemo(memoId: string, userId: string, data: UpdateTechnicalMemoInput) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    // Vérifier l'accès
    await this.getMemoById(memoId, userId)

    const memo = await prisma.memoire.update({
      where: { id: memoId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.status && { status: data.status }),
        ...(data.contentJson !== undefined && { contentJson: data.contentJson }),
        ...(data.contentText !== undefined && { contentText: data.contentText }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return memo
  }

  /**
   * Génère le contenu initial d'un mémoire (stub pour l'instant)
   */
  async generateMemo(memoId: string, userId: string) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    const memo = await this.getMemoById(memoId, userId)

    // TODO: Implémenter la génération IA
    // Pour l'instant, retourner un placeholder

    const placeholderContent = {
      sections: [],
      message: 'Génération IA en cours de développement',
    }

    const updated = await this.updateMemo(memoId, userId, {
      contentJson: placeholderContent,
      contentText: 'Mémoire en cours de génération...',
      status: 'IN_PROGRESS',
    })

    return updated
  }

  /**
   * Supprime un mémoire
   */
  async deleteMemo(memoId: string, userId: string): Promise<void> {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memo = await this.getMemoById(memoId, userId)

    // Supprimer le mémoire
    await prisma.memoire.delete({
      where: { id: memoId },
    })
  }

  /**
   * Exporte un mémoire (stub pour l'instant)
   */
  async exportMemo(memoId: string, userId: string, format: 'DOCX' | 'PDF' = 'DOCX') {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    const memo = await this.getMemoById(memoId, userId)

    if (memo.status !== 'READY') {
      throw new Error('Memo must be READY before export')
    }

    // TODO: Implémenter l'export
    // Pour l'instant, retourner un placeholder

    return {
      memoId: memo.id,
      format,
      filePath: null,
      message: 'Export en cours de développement',
    }
  }
}

export const technicalMemoService = new TechnicalMemoService()

