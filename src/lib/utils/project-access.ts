/**
 * Utilitaires pour sécuriser l'accès aux projets
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors'

/**
 * Récupère l'utilisateur authentifié depuis la session
 * @throws {UnauthorizedError} Si pas de session ou utilisateur non authentifié
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    throw new UnauthorizedError('Authentication required')
  }

  return session.user.id
}

/**
 * Vérifie que l'utilisateur a accès au projet et retourne le projet
 * @param projectId ID du projet
 * @param userId ID de l'utilisateur (optionnel, récupéré depuis la session si non fourni)
 * @throws {UnauthorizedError} Si l'utilisateur n'a pas accès au projet
 * @throws {NotFoundError} Si le projet n'existe pas
 */
export async function requireProjectAccess(
  projectId: string,
  userId?: string
): Promise<{ id: string; userId: string; name: string }> {
  // Récupérer userId depuis la session si non fourni
  const actualUserId = userId || (await requireAuth())

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      name: true,
    },
  })

  if (!project) {
    throw new NotFoundError('Project', projectId)
  }

  if (project.userId !== actualUserId) {
    throw new UnauthorizedError('You do not have access to this project')
  }

  return project
}

