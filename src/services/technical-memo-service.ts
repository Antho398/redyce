/**
 * Service métier pour la gestion des mémoires techniques
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { memoryTemplateService } from '@/services/memory-template-service'

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

    // Créer les sections à partir des questions extraites du template
    try {
      // Récupérer le template avec ses sections et questions
      const templateData = await memoryTemplateService.getTemplate(template.id, userId)
      
      console.log('Template data:', {
        status: templateData?.status,
        sectionsCount: templateData?.sections?.length || 0,
        questionsCount: templateData?.questions?.length || 0,
      })
      
      if (!templateData || templateData.status !== 'PARSED') {
        console.warn('Template not parsed yet or no data available', {
          status: templateData?.status,
          hasTemplate: !!templateData,
        })
        // Ne pas créer de sections si le template n'est pas parsé
        return memo
      }
      
      if (!templateData.questions || templateData.questions.length === 0) {
        console.warn('No questions found in template')
        return memo
      }

      // Construire la liste des sections à créer
      const sectionsToCreate: Array<{
        memoireId: string
        title: string
        order: number
        question: string | null
        status: string
        content: string | null
        sourceRequirementIds: string[]
      }> = []

      // Récupérer toutes les questions et les trier correctement
      const allQuestions = (templateData.questions || [])
        .filter((q: any) => !q.isGroupHeader) // Exclure les en-têtes de groupe
      
      console.log(`[createMemo] Found ${allQuestions.length} questions after filtering (from ${templateData.questions?.length || 0} total)`)
      
      if (allQuestions.length === 0) {
        console.warn('[createMemo] No questions found after filtering. Template questions:', templateData.questions)
        return memo
      }

      // Trier toutes les questions par sectionOrder puis par order
      allQuestions.sort((a: any, b: any) => {
        // Trier d'abord par sectionOrder
        const aSectionOrder = a.sectionOrder ?? 999999
        const bSectionOrder = b.sectionOrder ?? 999999
        if (aSectionOrder !== bSectionOrder) {
          return aSectionOrder - bSectionOrder
        }
        // Puis par order
        return (a.order || 0) - (b.order || 0)
      })

      // Créer une section MemoireSection pour chaque question
      let globalOrder = 1
      
      for (const q of allQuestions) {
        if (!q.title || q.title.trim() === '') {
          console.warn(`[createMemo] Skipping question with empty title at order ${q.order}`)
          continue
        }
        
        sectionsToCreate.push({
          memoireId: memo.id,
          title: q.title.trim(),
          order: globalOrder++,
          question: q.title.trim(),
          status: 'DRAFT',
          content: null,
          sourceRequirementIds: [],
        })
      }
      
      console.log(`[createMemo] Prepared ${sectionsToCreate.length} sections to create for memo ${memo.id}`)

      // Créer les sections en base
      console.log(`Creating ${sectionsToCreate.length} sections for memo ${memo.id}`)
      if (sectionsToCreate.length > 0) {
        const created = await prisma.memoireSection.createMany({
          data: sectionsToCreate,
        })
        console.log(`Successfully created ${created.count} sections`)
      } else {
        console.warn('No sections to create')
      }
    } catch (error) {
      console.error('[createMemo] Error creating sections from template questions:', error)
      console.error('[createMemo] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Ne pas échouer la création du mémoire si la création des sections échoue
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

  /**
   * Recrée les sections d'un mémoire à partir du template
   */
  async recreateSectionsFromTemplate(memoireId: string, userId: string) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    if (!prisma.memoire) {
      throw new Error(
        'Memoire model is not available in Prisma client. ' +
        'Please run: npx prisma generate && restart the Next.js server'
      )
    }

    // Récupérer le mémoire
    const memo = await prisma.memoire.findUnique({
      where: { id: memoireId },
      include: {
        template: true,
      },
    })

    if (!memo) {
      throw new NotFoundError('TechnicalMemo', memoireId)
    }

    if (memo.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    // Supprimer les sections existantes
    await prisma.memoireSection.deleteMany({
      where: { memoireId },
    })

    // Recréer les sections à partir du template (même logique que createMemo)
    try {
      const templateData = await memoryTemplateService.getTemplate(memo.templateDocumentId, userId)
      
      console.log('[recreateSections] Template data:', {
        status: templateData?.status,
        sectionsCount: templateData?.sections?.length || 0,
        questionsCount: templateData?.questions?.length || 0,
      })
      
      if (!templateData || templateData.status !== 'PARSED') {
        throw new Error(`Template not parsed yet (status: ${templateData?.status})`)
      }
      
      if (!templateData.questions || templateData.questions.length === 0) {
        throw new Error('No questions found in template')
      }

      const allQuestions = (templateData.questions || [])
        .filter((q: any) => !q.isGroupHeader)
        .sort((a: any, b: any) => {
          const aSectionOrder = a.sectionOrder ?? 999999
          const bSectionOrder = b.sectionOrder ?? 999999
          if (aSectionOrder !== bSectionOrder) {
            return aSectionOrder - bSectionOrder
          }
          return (a.order || 0) - (b.order || 0)
        })

      const sectionsToCreate: Array<{
        memoireId: string
        title: string
        order: number
        question: string | null
        status: string
        content: string | null
        sourceRequirementIds: string[]
      }> = []

      let globalOrder = 1
      
      for (const q of allQuestions) {
        if (!q.title || q.title.trim() === '') {
          continue
        }
        
        sectionsToCreate.push({
          memoireId: memo.id,
          title: q.title.trim(),
          order: globalOrder++,
          question: q.title.trim(),
          status: 'DRAFT',
          content: null,
          sourceRequirementIds: [],
        })
      }
      
      console.log(`[recreateSections] Creating ${sectionsToCreate.length} sections`)
      
      if (sectionsToCreate.length > 0) {
        const created = await prisma.memoireSection.createMany({
          data: sectionsToCreate,
        })
        console.log(`[recreateSections] Successfully created ${created.count} sections`)
        return created.count
      }
      
      return 0
    } catch (error) {
      console.error('[recreateSections] Error:', error)
      throw error
    }
  }
}

export const technicalMemoService = new TechnicalMemoService()

