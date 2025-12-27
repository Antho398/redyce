/**
 * Route API pour récupérer les questions du template d'un projet
 * GET /api/template-questions?projectId=xxx - Récupère les questions du template
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'
import { requireAuth, requireProjectAccess } from '@/lib/utils/project-access'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'projectId est requis' } },
        { status: 400 }
      )
    }

    // Vérifier l'accès au projet
    await requireProjectAccess(projectId, userId)

    // Trouver le template du projet
    const templateDoc = await prisma.document.findFirst({
      where: { projectId, documentType: 'MODELE_MEMOIRE' },
    })

    if (!templateDoc) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Aucun template trouvé pour ce projet' } },
        { status: 404 }
      )
    }

    // Récupérer les questions du template avec leur section pour trier
    const questions = await prisma.templateQuestion.findMany({
      where: { documentId: templateDoc.id },
      include: { section: { select: { order: true } } },
      orderBy: [{ order: 'asc' }],
    })

    // Trier par ordre de section puis par ordre de question
    questions.sort((a, b) => {
      const sectionOrderA = a.section?.order ?? 0
      const sectionOrderB = b.section?.order ?? 0
      if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB
      return a.order - b.order
    })

    return NextResponse.json<ApiResponse>({ success: true, data: questions }, { status: 200 })
  } catch (error) {
    console.error('GET /api/template-questions error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('not found') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}
