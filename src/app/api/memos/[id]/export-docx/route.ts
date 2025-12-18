/**
 * API Route pour l'export DOCX avec injection automatique des réponses
 * POST /api/memos/[id]/export-docx
 * 
 * Retourne le fichier DOCX + un rapport d'injection détaillé
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/project-access'
import { prisma } from '@/lib/prisma/client'
import { docxInjectionService, QuestionPositionMapping, InjectionReport } from '@/services/docx-injection-service'
import { fileStorage } from '@/lib/documents/storage'
import { isDocxCompatible } from '@/lib/utils/docx-placeholders'

interface ExportResponse {
  success: boolean
  data?: {
    // Fichier en base64 pour téléchargement côté client
    fileBase64: string
    fileName: string
    mimeType: string
    // Rapport d'injection
    report: InjectionReport
  }
  error?: {
    message: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ExportResponse>> {
  try {
    const userId = await requireAuth()
    const memoId = params.id

    // Récupérer le mémoire avec ses sections et le template
    const memo = await prisma.memoire.findUnique({
      where: { id: memoId },
      include: {
        project: true,
        template: true,
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!memo) {
      return NextResponse.json(
        { success: false, error: { message: 'Mémoire non trouvé' } },
        { status: 404 }
      )
    }

    if (memo.userId !== userId) {
      return NextResponse.json(
        { success: false, error: { message: 'Accès non autorisé' } },
        { status: 403 }
      )
    }

    if (!memo.template) {
      return NextResponse.json(
        { success: false, error: { message: 'Aucun template associé à ce mémoire' } },
        { status: 400 }
      )
    }

    // Vérifier que le template est un DOCX
    if (!isDocxCompatible(memo.template.mimeType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Le template n\'est pas au format DOCX. L\'export automatique n\'est possible qu\'avec un template DOCX.' 
          } 
        },
        { status: 400 }
      )
    }

    // Lire le buffer du template original
    const templateBuffer = await fileStorage.readFile(memo.template.filePath)

    // Récupérer les questions du template
    const templateQuestions = await prisma.templateQuestion.findMany({
      where: { documentId: memo.template.id },
      orderBy: { order: 'asc' },
    })

    if (templateQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Aucune question extraite du template' } },
        { status: 400 }
      )
    }

    // Vérifier si un template interne existe déjà
    let internalTemplateAnalysis = await prisma.documentAnalysis.findFirst({
      where: {
        documentId: memo.template.id,
        analysisType: 'docx_injection_template',
        status: 'completed',
      },
    })

    let mappings: QuestionPositionMapping[] = []

    // Si pas de template interne, le créer
    if (!internalTemplateAnalysis) {
      // Créer le template interne avec placeholders
      const internalTemplate = await docxInjectionService.createInternalTemplate(
        templateBuffer,
        templateQuestions.map(q => ({
          id: q.id,
          title: q.title,
          order: q.order,
          sectionId: q.sectionId || undefined,
        }))
      )

      mappings = internalTemplate.mappings

      // Stocker le template interne
      const internalTemplatePath = `internal-templates/${memo.template.id}_injection.docx`
      await fileStorage.saveBuffer(internalTemplatePath, internalTemplate.buffer)

      // Sauvegarder l'analyse
      internalTemplateAnalysis = await prisma.documentAnalysis.create({
        data: {
          documentId: memo.template.id,
          analysisType: 'docx_injection_template',
          status: 'completed',
          result: {
            internalTemplatePath,
            mappings: internalTemplate.mappings,
            originalHash: internalTemplate.originalHash,
            createdAt: internalTemplate.createdAt.toISOString(),
          },
        },
      })
    } else {
      // Récupérer les mappings existants
      const analysisResult = internalTemplateAnalysis.result as {
        internalTemplatePath: string
        mappings: QuestionPositionMapping[]
      }
      mappings = analysisResult.mappings
    }

    // Récupérer le template interne
    const analysisResult = internalTemplateAnalysis.result as {
      internalTemplatePath: string
      mappings: QuestionPositionMapping[]
    }

    const internalTemplateBuffer = await fileStorage.readFile(analysisResult.internalTemplatePath)

    // Créer le mapping réponses basé sur l'ordre des questions
    const finalAnswersMap = new Map<string, string>()
    
    for (const section of memo.sections) {
      if (section.content) {
        // Trouver la question template correspondante par ordre
        const matchingQuestion = templateQuestions.find(q => q.order === section.order)
        if (matchingQuestion) {
          finalAnswersMap.set(matchingQuestion.id, section.content)
        }
      }
    }

    // Exporter avec les réponses et générer le rapport
    const { buffer: exportedBuffer, report } = await docxInjectionService.exportWithAnswers(
      internalTemplateBuffer,
      finalAnswersMap,
      mappings,
      {
        missingAnswerText: '[À compléter]',
        preserveEmptyPlaceholders: false,
      }
    )

    // Générer le nom du fichier
    const sanitizedTitle = memo.title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, '').trim()
    const fileName = `${sanitizedTitle}_v${memo.versionNumber || 1}.docx`

    // Convertir le buffer en base64 pour le transfert JSON
    const fileBase64 = exportedBuffer.toString('base64')

    // Retourner le fichier et le rapport
    return NextResponse.json({
      success: true,
      data: {
        fileBase64,
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        report,
      },
    })

  } catch (error) {
    console.error('Export DOCX error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur lors de l\'export DOCX' 
        } 
      },
      { status: 500 }
    )
  }
}
