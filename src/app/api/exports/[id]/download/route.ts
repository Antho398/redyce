/**
 * Route API pour télécharger un export
 * GET /api/exports/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { memoireExportService } from '@/services/memoire-export-service'
import { fileStorage } from '@/lib/documents/storage'
import { ApiResponse } from '@/types/api'

export async function GET(
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

    // Récupérer l'export
    const exportRecord = await memoireExportService.getExportById(exportId, userId)

    if (exportRecord.status !== 'COMPLETED' || !exportRecord.filePath) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Export not ready or file not found',
          },
        },
        { status: 404 }
      )
    }

    // Vérifier que le fichier existe
    const fileExists = await fileStorage.fileExists(exportRecord.filePath)
    if (!fileExists) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Export file not found on disk',
          },
        },
        { status: 404 }
      )
    }

    // Lire le fichier
    const fileBuffer = await fileStorage.readFile(exportRecord.filePath)

    // Retourner le fichier avec les bons headers
    const fileName = exportRecord.fileName || `memoire-${exportRecord.id}.docx`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading export:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to download export',
        },
      },
      { status: 500 }
    )
  }
}

