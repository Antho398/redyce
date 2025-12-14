/**
 * Route API pour la gestion des projets
 * GET /api/projects - Liste des projets
 * POST /api/projects - Créer un projet
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { projectService } from '@/services/project-service'
import { createProjectSchema } from '@/lib/utils/validation'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
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
    const projects = await projectService.getUserProjects(userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch projects',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer la session avec getServerSession (avec headers pour App Router)
    const session = await getServerSession(authOptions)
    
    console.log('Session:', session ? 'exists' : 'null')
    console.log('Session user:', session?.user)
    console.log('Session user id:', session?.user?.id)
    
    if (!session || !session.user || !session.user.id) {
      console.error('Authentication failed: No session or user ID')
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
    
    // Vérifier que l'utilisateur existe dans la DB
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })
    
    if (!userExists) {
      console.error(`User ${userId} from session does not exist in database. User email: ${session.user.email}`)
      console.error('Session data:', JSON.stringify(session, null, 2))
      
      // Retourner une erreur 401 pour forcer une nouvelle authentification
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Session invalide. Veuillez vous reconnecter.',
          },
        },
        { status: 401 }
      )
    }
    
    console.log('User found in DB:', userExists.email, 'ID:', userExists.id)

    const body = await request.json()
    const data = createProjectSchema.parse(body)

    console.log('Creating project for user:', userId)
    const project = await projectService.createProject(userId, data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Gérer les erreurs Prisma (foreign key constraint)
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Database error: User not found. Please ensure you are properly authenticated.',
          },
        },
        { status: 400 }
      )
    }
    
    // Gérer les erreurs d'authentification
    if (error instanceof Error && (error.message.includes('Unauthorized') || (error as any).statusCode === 401)) {
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
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create project',
        },
      },
      { status: 500 }
    )
  }
}

