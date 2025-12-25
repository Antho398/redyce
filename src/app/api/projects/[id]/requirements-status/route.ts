/**
 * API pour récupérer le statut d'extraction des exigences d'un projet
 * GET /api/projects/[id]/requirements-status
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireProjectAccess } from '@/lib/utils/project-access'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'

interface RequirementsStatus {
  total: number
  done: number
  processing: number
  waiting: number
  error: number
  requirementsCount: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const projectId = params.id

    // Vérifier l'accès au projet
    await requireProjectAccess(projectId, userId)

    // Compter les documents par statut d'extraction
    const documents = await prisma.document.findMany({
      where: { projectId },
      select: { requirementStatus: true },
    })

    const total = documents.length
    let done = 0
    let processing = 0
    let waiting = 0
    let error = 0

    for (const doc of documents) {
      switch (doc.requirementStatus) {
        case 'DONE':
          done++
          break
        case 'PROCESSING':
          processing++
          break
        case 'WAITING':
          waiting++
          break
        case 'ERROR':
          error++
          break
        default:
          // null = jamais traité, on le compte comme "waiting" pour le calcul
          waiting++
          break
      }
    }

    // Compter le nombre total d'exigences extraites
    const requirementsCount = await prisma.requirement.count({
      where: { projectId },
    })

    const status: RequirementsStatus = {
      total,
      done,
      processing,
      waiting,
      error,
      requirementsCount,
    }

    return NextResponse.json<ApiResponse<RequirementsStatus>>({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error fetching requirements status:', error)

    const message = error instanceof Error ? error.message : 'Failed to fetch requirements status'
    const status =
      message.includes('not found') ? 404 :
      message.includes('access') ? 403 : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status }
    )
  }
}
