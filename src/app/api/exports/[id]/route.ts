/**
 * Route API pour gérer un export spécifique
 * DELETE /api/exports/[id] - Supprimer un export
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { fileStorage } from '@/lib/documents/storage'
import { ApiResponse } from '@/types/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

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
    const exportId = params.id

    // Récupérer l'export avec le projet pour vérifier les droits
    const exportRecord = await prisma.memoireExport.findUnique({
      where: { id: exportId },
      include: {
        project: true,
      },
    })

    if (!exportRecord) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Export non trouvé',
          },
        },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur a accès au projet
    if (exportRecord.project.userId !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Accès non autorisé',
          },
        },
        { status: 403 }
      )
    }

    // Supprimer le fichier du disque si présent
    if (exportRecord.filePath) {
      try {
        await fileStorage.deleteFile(exportRecord.filePath)
      } catch (err) {
        console.warn(`Could not delete file ${exportRecord.filePath}:`, err)
        // On continue même si le fichier n'existe plus
      }
    }

    // Supprimer l'enregistrement de la base de données
    await prisma.memoireExport.delete({
      where: { id: exportId },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { message: 'Export supprimé avec succès' },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting export:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete export',
        },
      },
      { status: 500 }
    )
  }
}
