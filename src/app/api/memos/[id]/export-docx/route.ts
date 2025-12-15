/**
 * Route API pour générer un export DOCX du mémoire
 * POST /api/memos/[id]/export-docx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { memoireExportService } from '@/services/memoire-export-service'
import { ApiResponse } from '@/types/api'
import { getUserMessage } from '@/lib/utils/business-errors'

export async function POST(
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
    const memoireId = params.id

    // Générer l'export
    const exportRecord = await memoireExportService.generateDOCXExport(memoireId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: exportRecord,
      },
      { status: 201 }
    )
  } catch (error) {
    // Log serveur (sans contenu sensible)
    console.error('[Export DOCX] Error:', {
      memoireId,
      userId,
      errorType: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    // Message utilisateur clair
    const userMessage = getUserMessage(error)

    // Code d'erreur HTTP approprié
    let statusCode = 500
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('access')) {
        statusCode = 403
      } else if (error.message.includes('not found')) {
        statusCode = 404
      } else if (error.message.includes('NO_TEMPLATE') || error.message.includes('NO_SECTIONS')) {
        statusCode = 400
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: userMessage,
        },
      },
      { status: statusCode }
    )
  }
}

