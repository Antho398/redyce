/**
 * Service métier pour la gestion des templates mémoire (Document MODELE_MEMOIRE)
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { parseDOCXTemplateWithAI, parsePDFTemplateWithAI } from './memory-template-parser-ai'
import { jobPriorityManager } from '@/services/job-priority-manager'
import { requirementExtractionJob } from '@/services/requirement-extraction-job'

export class MemoryTemplateService {
  /**
   * Définit ou remplace le template mémoire pour un projet.
   * Implémentation : marque le document comme MODELE_MEMOIRE et le retourne.
   */
  async createOrReplaceTemplate(projectId: string, documentId: string, userId: string, name?: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document || document.projectId !== projectId) {
      throw new NotFoundError('Document', documentId)
    }

    const isDOCX =
      document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      document.mimeType === 'application/msword'
    const isPDF = document.mimeType === 'application/pdf'
    if (!isDOCX && !isPDF) {
      throw new Error('Le template doit être un fichier DOCX ou PDF')
    }

    // IMPORTANT: Reclasser TOUS les anciens templates en AUTRE AVANT de définir le nouveau
    // Cela garantit qu'il n'y aura toujours qu'un seul template actif
    await prisma.document.updateMany({
      where: {
        projectId,
        documentType: 'MODELE_MEMOIRE',
      },
      data: { documentType: 'AUTRE' },
    })

    // Maintenant définir le nouveau document comme template
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        documentType: 'MODELE_MEMOIRE',
        name: name || document.name,
      },
    })

    return {
      id: updated.id,
      name: updated.name,
      documentType: updated.documentType,
      status: 'UPLOADED',
      metaJson: null,
    }
  }

  /**
   * Parse un template mémoire pour extraire les sections (sans persistance V1).
   * Ce job est haute priorité et interrompt l'extraction des exigences.
   */
  async parseTemplate(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const templateDoc = await prisma.document.findFirst({
      where: { projectId, documentType: 'MODELE_MEMOIRE' },
    })
    if (!templateDoc) {
      throw new NotFoundError('Template', projectId)
    }

    // Enregistrer comme job haute priorité (interrompt l'extraction des exigences)
    const jobId = jobPriorityManager.registerJob(projectId, 'QUESTION_EXTRACTION')
    const { canStart, pausedJobId } = jobPriorityManager.startJob(jobId)

    if (!canStart) {
      // Ne devrait pas arriver car c'est un job HIGH priority
      console.warn(`[MemoryTemplateService] Cannot start parseTemplate job ${jobId}`)
    }

    if (pausedJobId) {
      console.log(`[MemoryTemplateService] Paused requirement extraction job ${pausedJobId} for question extraction`)
    }

    const buffer = await fileStorage.readFile(templateDoc.filePath)
    const isDOCX =
      templateDoc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      templateDoc.mimeType === 'application/msword'

    // Récupérer l'email de l'utilisateur pour le tracking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    // Parser avec IA pour extraire sections, questions et formulaire entreprise
    const parsedResult = isDOCX
      ? await parseDOCXTemplateWithAI(buffer, userId, user?.email, projectId, templateDoc.id)
      : await parsePDFTemplateWithAI(buffer, userId, user?.email, projectId, templateDoc.id)

    const warnings: string[] = []
    if (parsedResult.sections.length === 0) warnings.push('Aucune section détectée dans le template')
    if (parsedResult.questions.length === 0) warnings.push('Aucune question détectée dans le template')

    // Supprimer les anciennes données
    await prisma.templateQuestion.deleteMany({
      where: { documentId: templateDoc.id },
    })
    await prisma.templateSection.deleteMany({
      where: { documentId: templateDoc.id },
    })
    await prisma.templateCompanyForm.deleteMany({
      where: { documentId: templateDoc.id },
    })

    // Stocker les sections en BDD
    const createdSections = await Promise.all(
      parsedResult.sections.map((section) =>
        prisma.templateSection.create({
          data: {
            documentId: templateDoc.id,
            order: section.order,
            title: section.title,
            required: section.required,
            sourceAnchorJson: section.sourceAnchorJson || null,
          },
        })
      )
    )

    // Créer un mapping sectionOrder -> sectionId
    const sectionMap = new Map<number, string>()
    createdSections.forEach((section) => {
      sectionMap.set(section.order, section.id)
    })

    // Stocker les questions en BDD (avec référence aux sections)
    await prisma.templateQuestion.createMany({
      data: parsedResult.questions.map((question) => {
        const sectionId = question.sectionOrder ? sectionMap.get(question.sectionOrder) : null
        return {
          documentId: templateDoc.id,
          sectionId,
          order: question.order,
          title: question.title,
          questionType: question.questionType,
          required: question.required,
          parentQuestionOrder: question.parentQuestionOrder || null,
          isGroupHeader: question.isGroupHeader || false,
          sourceAnchorJson: question.sourceAnchorJson || null,
        }
      }),
    })

    // Stocker le formulaire entreprise si présent
    if (parsedResult.companyForm) {
      await prisma.templateCompanyForm.create({
        data: {
          documentId: templateDoc.id,
          fields: parsedResult.companyForm.fields as any,
        },
      })
    }

    const metaJson = {
      nbSections: parsedResult.sections.length,
      nbQuestions: parsedResult.questions.length,
      hasCompanyForm: !!parsedResult.companyForm,
      warnings,
      parsedAt: new Date().toISOString(),
    }

    // Marquer le job comme terminé et reprendre l'extraction des exigences si elle était en pause
    const resumedJob = jobPriorityManager.completeJob(jobId, true)
    if (resumedJob) {
      console.log(`[MemoryTemplateService] Resuming requirement extraction job ${resumedJob.id}`)
      // Reprendre l'extraction des exigences en arrière-plan
      setImmediate(() => {
        requirementExtractionJob.extractForProject(projectId, userId, resumedJob.currentDocumentIndex || 0)
      })
    }

    return {
      id: templateDoc.id,
      name: templateDoc.name,
      status: 'PARSED',
      metaJson,
      sections: parsedResult.sections,
      questions: parsedResult.questions,
      companyForm: parsedResult.companyForm,
    }
  }

  /**
   * Récupère le template par documentId
   */
  async getTemplate(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
        templateSections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        templateQuestions: {
          where: { sectionId: null },
          orderBy: { order: 'asc' },
        },
        templateCompanyForm: true,
      },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    // Convertir les sections BDD
    const sections = document.templateSections.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      required: s.required,
      sourceAnchorJson: s.sourceAnchorJson as any,
    }))

    // Convertir les questions BDD
    const questions: any[] = []
    
    // Questions dans les sections
    document.templateSections.forEach((section) => {
      section.questions.forEach((q) => {
        questions.push({
          id: q.id,
          sectionId: q.sectionId,
          sectionOrder: section.order,
          order: q.order,
          title: q.title,
          questionType: q.questionType,
          required: q.required,
          parentQuestionOrder: q.parentQuestionOrder,
          isGroupHeader: q.isGroupHeader,
          sourceAnchorJson: q.sourceAnchorJson as any,
        })
      })
    })
    
    // Questions sans section
    document.templateQuestions.forEach((q) => {
      questions.push({
        id: q.id,
        sectionId: null,
        sectionOrder: null,
        order: q.order,
        title: q.title,
        questionType: q.questionType,
        required: q.required,
        parentQuestionOrder: q.parentQuestionOrder,
        isGroupHeader: q.isGroupHeader,
        sourceAnchorJson: q.sourceAnchorJson as any,
      })
    })

    const status = sections.length > 0 || questions.length > 0 ? 'PARSED' : 'UPLOADED'
    const metaJson = sections.length > 0 || questions.length > 0
      ? {
          nbSections: sections.length,
          nbQuestions: questions.length,
          hasCompanyForm: !!document.templateCompanyForm,
          parsedAt: sections[0] ? document.templateSections[0]?.createdAt?.toISOString() : questions[0] ? document.templateQuestions[0]?.createdAt?.toISOString() : new Date().toISOString(),
        }
      : null

    return {
      id: document.id,
      name: document.name,
      status,
      documentType: document.documentType,
      metaJson,
      sections,
      questions,
      companyForm: document.templateCompanyForm
        ? {
            fields: document.templateCompanyForm.fields as any,
          }
        : null,
    }
  }

  /**
   * Récupère le template d'un projet (Document de type MODELE_MEMOIRE)
   */
  async getProjectTemplate(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const templateDoc = await prisma.document.findFirst({
      where: { projectId, documentType: 'MODELE_MEMOIRE' },
      include: {
        templateSections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        templateQuestions: {
          where: { sectionId: null }, // Questions sans section
          orderBy: { order: 'asc' },
        },
        templateCompanyForm: true,
      },
    })

    if (!templateDoc) return null

    // Convertir les sections BDD
    const sections = templateDoc.templateSections.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      required: s.required,
      sourceAnchorJson: s.sourceAnchorJson as any,
    }))

    // Convertir les questions BDD
    const questions: any[] = []
    
    // Questions dans les sections
    templateDoc.templateSections.forEach((section) => {
      section.questions.forEach((q) => {
        questions.push({
          id: q.id,
          sectionId: q.sectionId,
          sectionOrder: section.order,
          order: q.order,
          title: q.title,
          questionType: q.questionType,
          required: q.required,
          parentQuestionOrder: q.parentQuestionOrder,
          isGroupHeader: q.isGroupHeader,
          sourceAnchorJson: q.sourceAnchorJson as any,
        })
      })
    })
    
    // Questions sans section
    templateDoc.templateQuestions.forEach((q) => {
      questions.push({
        id: q.id,
        sectionId: null,
        sectionOrder: null,
        order: q.order,
        title: q.title,
        questionType: q.questionType,
        required: q.required,
        parentQuestionOrder: q.parentQuestionOrder,
        isGroupHeader: q.isGroupHeader,
        sourceAnchorJson: q.sourceAnchorJson as any,
      })
    })

    const status = sections.length > 0 || questions.length > 0 ? 'PARSED' : 'UPLOADED'
    const metaJson = sections.length > 0 || questions.length > 0
      ? {
          nbSections: sections.length,
          nbQuestions: questions.length,
          hasCompanyForm: !!templateDoc.templateCompanyForm,
          parsedAt: sections[0] ? templateDoc.templateSections[0]?.createdAt?.toISOString() : questions[0] ? templateDoc.templateQuestions[0]?.createdAt?.toISOString() : new Date().toISOString(),
        }
      : null

    return {
      id: templateDoc.id,
      name: templateDoc.name,
      status,
      documentType: templateDoc.documentType,
      metaJson,
      sections,
      questions,
      companyForm: templateDoc.templateCompanyForm
        ? {
            fields: templateDoc.templateCompanyForm.fields as any,
          }
        : null,
    }
  }

  /**
   * Retire un document des templates (supprime le document car il n'est plus utile).
   */
  async removeTemplateDocument(projectId: string, documentId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document || document.projectId !== projectId) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.documentType !== 'MODELE_MEMOIRE') {
      return document
    }

    // Vérifier si un mémoire technique existe pour ce template
    const existingMemo = await prisma.memoire.findFirst({
      where: {
        templateDocumentId: documentId,
        projectId: projectId,
      },
    })

    if (existingMemo) {
      throw new Error('Pour supprimer le template, vous devez d\'abord supprimer le mémoire technique')
    }

    // Supprimer complètement le document pour éviter qu'il apparaisse dans les documents de contexte
    await prisma.document.delete({
      where: { id: documentId },
    })

    return document
  }

  /**
   * Met à jour une question de template
   * 
   * RÈGLE V1 : Immutabilité des questions après extraction
   * - Les champs suivants sont considérés immuables : title, order, questionType, required, isGroupHeader
   * - Cependant, l'utilisateur peut modifier explicitement via l'UI (correction d'erreurs d'extraction)
   * - INTERDIT : Modifications silencieuses automatiques (par le système sans action utilisateur)
   * - Cette méthode doit être appelée UNIQUEMENT suite à une action utilisateur explicite
   */
  async updateTemplateQuestion(
    questionId: string,
    userId: string,
    data: {
      title?: string
      path?: string | null
      required?: boolean
      order?: number
      questionType?: string
      parentQuestionOrder?: number | null
      isGroupHeader?: boolean
    }
  ) {
    // Récupérer la question pour vérifier les droits
    const question = await prisma.templateQuestion.findUnique({
      where: { id: questionId },
      include: { document: { include: { project: true } } },
    })

    if (!question) {
      throw new NotFoundError('Question', questionId)
    }

    if (question.document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this question')
    }

    // NOTE V1 : Les modifications sont autorisées uniquement via action utilisateur explicite
    // Les champs title, order, questionType, required, isGroupHeader sont normalement immuables
    // mais peuvent être modifiés pour corriger des erreurs d'extraction
    return await prisma.templateQuestion.update({
      where: { id: questionId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(data.parentQuestionOrder !== undefined && { parentQuestionOrder: data.parentQuestionOrder }),
        ...(data.isGroupHeader !== undefined && { isGroupHeader: data.isGroupHeader }),
      },
    })
  }

  /**
   * Supprime une question de template
   */
  async deleteTemplateQuestion(questionId: string, userId: string) {
    // Récupérer la question pour vérifier les droits
    const question = await prisma.templateQuestion.findUnique({
      where: { id: questionId },
      include: { document: { include: { project: true } } },
    })

    if (!question) {
      throw new NotFoundError('Question', questionId)
    }

    if (question.document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this question')
    }

    // Supprimer
    await prisma.templateQuestion.delete({
      where: { id: questionId },
    })
  }

  /**
   * Crée une nouvelle section de template
   */
  async createTemplateSection(
    documentId: string,
    userId: string,
    data: {
      title: string
      order: number
      required?: boolean
    }
  ) {
    // Vérifier les droits
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    return await prisma.templateSection.create({
      data: {
        documentId,
        title: data.title,
        order: data.order,
        required: data.required !== false,
      },
    })
  }

  /**
   * Crée une nouvelle question de template
   */
  async createTemplateQuestion(
    documentId: string,
    userId: string,
    data: {
      sectionId?: string | null
      sectionOrder?: number | null
      title: string
      order: number
      questionType?: 'TEXT' | 'YES_NO'
      required?: boolean
      parentQuestionOrder?: number | null
      isGroupHeader?: boolean
    }
  ) {
    // Vérifier les droits
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    })

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    // Si sectionOrder est fourni mais pas sectionId, trouver la section correspondante
    let sectionId = data.sectionId
    if (data.sectionOrder && !sectionId) {
      const section = await prisma.templateSection.findFirst({
        where: { documentId, order: data.sectionOrder },
      })
      sectionId = section?.id || null
    }

    return await prisma.templateQuestion.create({
      data: {
        documentId,
        sectionId,
        title: data.title,
        order: data.order,
        questionType: data.questionType || 'TEXT',
        required: data.required !== false,
        parentQuestionOrder: data.parentQuestionOrder || null,
        isGroupHeader: data.isGroupHeader || false,
      },
    })
  }

  /**
   * Supprime une section de template
   */
  async deleteTemplateSection(sectionId: string, userId: string) {
    const section = await prisma.templateSection.findUnique({
      where: { id: sectionId },
      include: { document: { include: { project: true } } },
    })

    if (!section) {
      throw new NotFoundError('Section', sectionId)
    }

    if (section.document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this section')
    }

    await prisma.templateSection.delete({
      where: { id: sectionId },
    })
  }
}

export const memoryTemplateService = new MemoryTemplateService()

