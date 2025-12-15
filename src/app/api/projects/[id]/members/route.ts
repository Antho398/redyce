/**
 * Route API pour la gestion des membres d'un projet
 * GET /api/projects/[id]/members - Liste les membres
 * POST /api/projects/[id]/members - Ajoute un membre
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { collaborationService } from '@/services/collaboration-service'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['OWNER', 'CONTRIBUTOR', 'REVIEWER']),
})

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
    const projectId = params.id

    const members = await collaborationService.getProjectMembers(projectId, userId)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: members,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching project members:', error)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch project members',
        },
      },
      { status: 500 }
    )
  }
}

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
    const projectId = params.id
    const body = await request.json()

    const validatedData = addMemberSchema.parse(body)

    const member = await collaborationService.addProjectMember(userId, {
      projectId,
      ...validatedData,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding project member:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    const statusCode =
      error instanceof Error && error.message.includes('Only project owner')
        ? 403
        : error instanceof Error && error.message.includes('not found')
        ? 404
        : 500

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to add project member',
        },
      },
      { status: statusCode }
    )
  }
}

