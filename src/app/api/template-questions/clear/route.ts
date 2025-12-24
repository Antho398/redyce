/**
 * API Route: DELETE /api/template-questions/clear
 * Supprime toutes les questions extraites d'un template
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { message: 'projectId requis' } },
        { status: 400 }
      )
    }

    // Vérifier l'accès au projet
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { message: 'Projet non trouvé ou accès refusé' } },
        { status: 404 }
      )
    }

    // Récupérer le template du projet
    const template = await prisma.document.findFirst({
      where: {
        projectId,
        documentType: 'MODELE_MEMOIRE',
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: { message: 'Aucun template trouvé pour ce projet' } },
        { status: 404 }
      )
    }

    // GARDE-FOU : Vérifier s'il existe des mémoires utilisant ce template
    const existingMemos = await prisma.memoire.findMany({
      where: { templateDocumentId: template.id },
      select: {
        id: true,
        title: true,
        versionNumber: true,
        sections: {
          where: {
            content: { not: null },
          },
          select: { id: true },
        },
      },
    })

    // Compter les mémoires avec du contenu
    const memosWithContent = existingMemos.filter(m => m.sections.length > 0)

    if (memosWithContent.length > 0) {
      const memoNames = memosWithContent
        .map(m => `"${m.title}" (V${m.versionNumber || 1})`)
        .slice(0, 3)
        .join(', ')
      const andMore = memosWithContent.length > 3 ? ` et ${memosWithContent.length - 3} autre(s)` : ''

      return NextResponse.json(
        {
          success: false,
          error: {
            title: `Impossible d'effacer les questions`,
            message: `Il y a des réponses associées au(x) mémoire(s) suivant(s) : ${memoNames}${andMore}.`,
            action: `→ Supprimez d'abord les mémoires ou créez une nouvelle version.`,
            code: 'MEMOS_HAVE_CONTENT',
            memosCount: memosWithContent.length,
          },
        },
        { status: 409 } // Conflict
      )
    }

    // Si mémoires existent mais sont vides, les supprimer automatiquement
    if (existingMemos.length > 0) {
      await prisma.memoire.deleteMany({
        where: {
          id: { in: existingMemos.map(m => m.id) },
        },
      })
    }

    // Supprimer toutes les questions du template
    const deletedQuestions = await prisma.templateQuestion.deleteMany({
      where: {
        documentId: template.id,
      },
    })

    // Supprimer toutes les sections du template
    const deletedSections = await prisma.templateSection.deleteMany({
      where: {
        documentId: template.id,
      },
    })

    // Mettre à jour le statut du template
    // Remettre le status à "uploaded" pour permettre une nouvelle extraction
    const currentMeta = (template.metaJson as Record<string, unknown>) || {}
    
    await prisma.document.update({
      where: { id: template.id },
      data: {
        status: 'uploaded', // Remettre à uploaded pour permettre re-parsing
        metaJson: {
          ...currentMeta,
          nbSections: 0,
          nbQuestions: 0,
          cleared: true,
          clearedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        deletedQuestions: deletedQuestions.count,
        deletedSections: deletedSections.count,
      },
    })
  } catch (error) {
    console.error('Error clearing template questions:', error)
    
    // Retourner plus de détails sur l'erreur
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur inconnue'
    
    return NextResponse.json(
      { success: false, error: { message: errorMessage } },
      { status: 500 }
    )
  }
}

