/**
 * Utilitaires de sécurité pour vérifier les permissions
 * Vérifie systématiquement user → project → memoire → section → export
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from './errors'

/**
 * Vérifie qu'un utilisateur a accès à un projet
 * Retourne le projet si trouvé et accessible
 */
export async function ensureProjectAccess(
  projectId: string,
  userId: string
): Promise<any> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new NotFoundError('Project', projectId)
  }

  // Vérifier si l'utilisateur est propriétaire
  if (project.userId === userId) {
    return project
  }

  // Vérifier si l'utilisateur est membre
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  })

  if (!member) {
    throw new UnauthorizedError('You do not have access to this project')
  }

  return project
}

/**
 * Vérifie qu'un utilisateur a accès à un mémoire
 * Retourne le mémoire si trouvé et accessible
 */
export async function ensureMemoireAccess(
  memoireId: string,
  userId: string
): Promise<any> {
  const memoire = await prisma.memoire.findUnique({
    where: { id: memoireId },
    include: {
      project: true,
    },
  })

  if (!memoire) {
    throw new NotFoundError('Memoire', memoireId)
  }

  // Vérifier l'accès au projet parent
  await ensureProjectAccess(memoire.projectId, userId)

  return memoire
}

/**
 * Vérifie qu'un utilisateur a accès à une section
 * Retourne la section si trouvée et accessible
 */
export async function ensureSectionAccess(
  sectionId: string,
  userId: string
): Promise<any> {
  const section = await prisma.memoireSection.findUnique({
    where: { id: sectionId },
    include: {
      memoire: {
        include: {
          project: true,
        },
      },
    },
  })

  if (!section) {
    throw new NotFoundError('MemoireSection', sectionId)
  }

  // Vérifier l'accès au mémoire parent
  await ensureMemoireAccess(section.memoireId, userId)

  return section
}

