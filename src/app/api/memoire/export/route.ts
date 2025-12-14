/**
 * Route API pour exporter le mémoire en DOCX
 * POST /api/memoire/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { memorySectionService } from '@/services/memory-section-service'
import { exportMemorySchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const body = await request.json()

  const { projectId, format } = exportMemorySchema.parse(body)

  logOperationStart('Memory Export', {
    userId,
    projectId,
    format,
  })

  try {
    // TODO: Implémenter l'export DOCX/PDF
    // Pour l'instant, on retourne juste les sections avec leurs réponses
    const sections = await memorySectionService.getProjectSections(projectId, userId)

    logOperationSuccess('Memory Export', {
      userId,
      projectId,
      format,
      sectionsCount: sections.length,
    })

    // TODO: Générer le fichier DOCX/PDF et le retourner
    // Pour l'instant, on retourne les données
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          sections,
          format,
          message: 'Export functionality will be implemented soon',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logOperationError('Memory Export', error as Error, {
      userId,
      projectId,
      format,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to export memory',
        },
      },
      { status: 500 }
    )
  }
}

