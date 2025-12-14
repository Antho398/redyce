/**
 * Service métier pour la gestion des templates mémoire
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { parseDOCXTemplate, parsePDFTemplate } from './memory-template-parser'

export class MemoryTemplateService {

  /**
   * Crée ou remplace un template mémoire à partir d'un document uploadé
   * Si un template existe déjà, il est remplacé (purge sections/answers)
   */
  async createOrReplaceTemplate(
    projectId: string,
    documentId: string,
    userId: string,
    name?: string
  ) {
    // Vérifier l'accès au projet
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Vérifier que le document existe et appartient au projet
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document || document.projectId !== projectId) {
      throw new NotFoundError('Document', documentId)
    }

    // Vérifier le format (DOCX ou PDF)
    const isDOCX =
      document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      document.mimeType === 'application/msword'
    const isPDF = document.mimeType === 'application/pdf'

    if (!isDOCX && !isPDF) {
      throw new Error('Le template doit être un fichier DOCX ou PDF')
    }

    // Si un template existe déjà, le supprimer avec ses dépendances
    const existingTemplate = await prisma.memoryTemplate.findUnique({
      where: { projectId },
      include: {
        sections: {
          include: {
            answer: true,
          },
        },
      },
    })

    if (existingTemplate) {
      // Supprimer les sections (cascade supprimera les answers)
      await prisma.memorySection.deleteMany({
        where: { templateId: existingTemplate.id },
      })
      
      // Supprimer les exports
      await prisma.memoryExport.deleteMany({
        where: { templateId: existingTemplate.id },
      })

      // Supprimer le template
      await prisma.memoryTemplate.delete({
        where: { id: existingTemplate.id },
      })
    }

    // Créer le nouveau template
    const template = await prisma.memoryTemplate.create({
      data: {
        projectId,
        documentId,
        name: name || document.name,
        status: 'UPLOADED',
      },
    })

    return template
  }

  /**
   * Parse un template mémoire pour extraire les sections
   */
  async parseTemplate(projectId: string, userId: string) {
    const template = await prisma.memoryTemplate.findUnique({
      where: { projectId },
      include: {
        project: true,
        document: true,
      },
    })

    if (!template) {
      throw new NotFoundError('MemoryTemplate', projectId)
    }

    if (template.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this template')
    }

    // Mettre à jour le statut
    await prisma.memoryTemplate.update({
      where: { id: template.id },
      data: { status: 'PARSING' },
    })

    try {
      // Lire le document
      const buffer = await fileStorage.readFile(template.document.filePath)

      // Parser selon le type de document
      const isDOCX =
        template.document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        template.document.mimeType === 'application/msword'
      
      let extractedSections
      if (isDOCX) {
        extractedSections = await parseDOCXTemplate(buffer)
      } else {
        extractedSections = await parsePDFTemplate(buffer)
      }

      // Supprimer les anciennes sections (cascade supprimera les answers)
      await prisma.memorySection.deleteMany({
        where: { templateId: template.id },
      })

      // Créer les nouvelles sections et leurs answers vides
      const createdSections = []
      for (const section of extractedSections) {
        const created = await prisma.memorySection.create({
          data: {
            projectId: template.projectId,
            templateId: template.id,
            order: section.order,
            title: section.title,
            path: section.path || null,
            sourceAnchorJson: section.sourceAnchorJson || null,
            required: section.required,
          },
        })

        // Créer une réponse vide pour chaque section
        await prisma.memoryAnswer.create({
          data: {
            projectId: template.projectId,
            sectionId: created.id,
            contentHtml: '',
            status: 'DRAFT',
          },
        })

        createdSections.push(created)
      }

      // Préparer les métadonnées
      const warnings: string[] = []
      if (extractedSections.length === 0) {
        warnings.push('Aucune section détectée dans le template')
      }

      // Mettre à jour le template
      await prisma.memoryTemplate.update({
        where: { id: template.id },
        data: {
          status: 'PARSED',
          parsedAt: new Date(),
          metaJson: {
            nbSections: extractedSections.length,
            warnings,
          },
        },
      })

      return {
        ...template,
        status: 'PARSED',
        parsedAt: new Date(),
        sections: createdSections,
      }
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      await prisma.memoryTemplate.update({
        where: { id: template.id },
        data: {
          status: 'FAILED',
          metaJson: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      })

      throw error
    }
  }


  /**
   * Récupère le template d'un projet
   */
  async getProjectTemplate(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    const template = await prisma.memoryTemplate.findUnique({
      where: { projectId },
      include: {
        document: true,
        sections: {
          include: {
            answer: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return template
  }

}

export const memoryTemplateService = new MemoryTemplateService()

