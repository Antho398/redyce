/**
 * Route API pour la gestion des sections d'un mémoire
 * GET /api/memos/[id]/sections - Liste des sections avec regroupement par ITEM
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let session: any = null
  try {
    session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const memoireId = params.id

    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memo = await prisma.memoire.findUnique({
      where: { id: memoireId },
    })

    if (!memo) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Memo not found',
          },
        },
        { status: 404 }
      )
    }

    if (memo.userId !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized: You do not have access to this memo',
          },
        },
        { status: 403 }
      )
    }

    // Récupérer les sections du mémoire
    const sections = await prisma.memoireSection.findMany({
      where: { memoireId },
      orderBy: { order: 'asc' },
    })

    // Récupérer les sections (ITEMS) et questions du template pour le mapping
    const templateSections = await prisma.templateSection.findMany({
      where: { documentId: memo.templateDocumentId },
      orderBy: { order: 'asc' },
    })

    const templateQuestions = await prisma.templateQuestion.findMany({
      where: { documentId: memo.templateDocumentId },
      orderBy: [{ sectionId: 'asc' }, { order: 'asc' }],
    })

    // Créer un mapping question title -> section info
    const questionToSectionMap = new Map<string, { sectionId: string; sectionTitle: string; sectionOrder: number }>()

    for (const question of templateQuestions) {
      if (question.sectionId) {
        const templateSection = templateSections.find(s => s.id === question.sectionId)
        if (templateSection) {
          // Normaliser le titre pour le matching (trim, lowercase)
          const normalizedTitle = question.title.trim().toLowerCase()
          questionToSectionMap.set(normalizedTitle, {
            sectionId: templateSection.id,
            sectionTitle: templateSection.title,
            sectionOrder: templateSection.order,
          })
        }
      }
    }

    // Enrichir les sections avec les infos de l'ITEM
    const enrichedSections = sections.map(section => {
      const normalizedQuestion = (section.question || section.title).trim().toLowerCase()
      const sectionInfo = questionToSectionMap.get(normalizedQuestion)

      return {
        ...section,
        // Infos du groupe/ITEM
        itemId: sectionInfo?.sectionId || null,
        itemTitle: sectionInfo?.sectionTitle || null,
        itemOrder: sectionInfo?.sectionOrder ?? null,
      }
    })

    // Récupérer aussi la liste des ITEMS pour l'affichage
    const items = templateSections.map(s => ({
      id: s.id,
      title: s.title,
      order: s.order,
    }))

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          sections: enrichedSections,
          items, // Liste des ITEMS pour le regroupement côté client
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      operation: 'GET /api/memos/[id]/sections',
      resourceId: params.id,
      userId: session?.user?.id,
    })
  }
}

