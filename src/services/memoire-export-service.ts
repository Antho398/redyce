/**
 * Service pour l'export DOCX des mémoires techniques
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { BusinessErrors } from '@/lib/utils/business-errors'

export class MemoireExportService {
  /**
   * Génère un export DOCX du mémoire
   */
  async generateDOCXExport(memoireId: string, userId: string) {
    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memoire = await prisma.memoire.findUnique({
      where: { id: memoireId },
      include: {
        project: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        template: true,
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!memoire) {
      throw new NotFoundError('Memoire', memoireId)
    }

    if (memoire.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    // Vérifier que le template existe
    if (!memoire.template) {
      throw BusinessErrors.NO_TEMPLATE
    }

    // Vérifier qu'il y a des sections
    if (!memoire.sections || memoire.sections.length === 0) {
      throw BusinessErrors.MEMOIRE_NO_SECTIONS
    }

    // Créer l'enregistrement d'export en base (status PENDING)
    const exportRecord = await prisma.memoireExport.create({
      data: {
        memoireId,
        projectId: memoire.projectId,
        type: 'DOCX',
        status: 'PENDING',
      },
    })

    try {
      // Identifier les sections vides
      const emptySections = memoire.sections.filter((s) => !s.content || s.content.trim().length === 0)

      // Générer le document DOCX
      const docxBuffer = await this.buildDOCXDocument(memoire, emptySections)

      // Sauvegarder le fichier
      const fileName = `memoire-${memoire.id}-${Date.now()}.docx`
      const { filePath } = await fileStorage.saveFile(docxBuffer, fileName)

      // Mettre à jour l'export avec le chemin du fichier
      const updatedExport = await prisma.memoireExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'COMPLETED',
          filePath: filePath,
          fileName: fileName,
          metadata: {
            sectionsCount: memoire.sections.length,
            emptySectionsCount: emptySections.length,
            emptySections: emptySections.map((s) => ({
              id: s.id,
              title: s.title,
              order: s.order,
            })),
            exportDate: new Date().toISOString(),
            projectName: memoire.project.name,
            memoireTitle: memoire.title,
          },
        },
      })

      return updatedExport
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      await prisma.memoireExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }

  /**
   * Construit le document DOCX à partir du mémoire
   */
  private async buildDOCXDocument(memoire: any, emptySections: any[]): Promise<Buffer> {
    const children: (Paragraph | Paragraph[])[] = []

    // En-tête : Nom du projet + Date + Nom entreprise (placeholder)
    children.push(
      new Paragraph({
        text: memoire.project.name,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Mémoire technique - ${memoire.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 400 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Date : ${new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            bold: true,
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '[Nom de l\'entreprise]',
            italics: true,
          }),
        ],
        spacing: { after: 600 },
      })
    )

    // Avertissement si sections vides
    if (emptySections.length > 0) {
      children.push(
        new Paragraph({
          text: '⚠️ EXPORT PARTIEL',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Attention : ${emptySections.length} section(s) n'ont pas été complétées :`,
              bold: true,
            }),
          ],
          spacing: { after: 200 },
        })
      )

      emptySections.forEach((section) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• Section ${section.order} : ${section.title}`,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      })

      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 },
        })
      )
    }

    // Sections du mémoire
    memoire.sections.forEach((section: any, index: number) => {
      // Titre de section
      children.push(
        new Paragraph({
          text: `Section ${section.order} : ${section.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: index === 0 ? 0 : 400, after: 200 },
        })
      )

      // Question (si présente)
      if (section.question) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.question,
                bold: true,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          })
        )
      }

      // Contenu de la section
      if (section.content && section.content.trim().length > 0) {
        // Séparer le contenu en paragraphes (par retours à la ligne)
        const paragraphs = section.content.split('\n').filter((p: string) => p.trim().length > 0)
        
        paragraphs.forEach((paragraph: string) => {
          children.push(
            new Paragraph({
              text: paragraph.trim(),
              spacing: { after: 200 },
            })
          )
        })
      } else {
        // Section vide
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '[Section non complétée]',
                italics: true,
                color: '808080',
              }),
            ],
            spacing: { after: 300 },
          })
        )
      }

      // Séparateur entre sections
      if (index < memoire.sections.length - 1) {
        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 300 },
          })
        )
      }
    })

    // Créer le document
    const doc = new Document({
      sections: [
        {
          children: children.flat(),
        },
      ],
    })

    // Générer le buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer
  }

  /**
   * Récupère tous les exports d'un projet
   */
  async getProjectExports(projectId: string, userId: string) {
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

    const exports = await prisma.memoireExport.findMany({
      where: { projectId },
      include: {
        memoire: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return exports
  }

  /**
   * Récupère un export par son ID
   */
  async getExportById(exportId: string, userId: string) {
    const exportRecord = await prisma.memoireExport.findUnique({
      where: { id: exportId },
      include: {
        project: true,
        memoire: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!exportRecord) {
      throw new NotFoundError('MemoireExport', exportId)
    }

    if (exportRecord.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this export')
    }

    return exportRecord
  }
}

export const memoireExportService = new MemoireExportService()

