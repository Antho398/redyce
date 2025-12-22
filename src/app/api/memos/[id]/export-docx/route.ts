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

    // Lire le template DOCX depuis le stockage
    const templateBuffer = await fileStorage.readFile(memo.template.filePath)

    // Injecter les réponses dans le template
    const { docxBuffer, report } = await docxInjectionService.injectAnswers(
      templateBuffer,
      memoId,
      userId
    )

    // Convertir le buffer en base64 pour l'envoi au client
    const fileBase64 = docxBuffer.toString('base64')
    const fileName = `memoire-${memo.title || memoId}-${Date.now()}.docx`

    return NextResponse.json({
      success: true,
      data: {
        fileBase64,
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        report,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('[Export DOCX] Error:', error)
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
