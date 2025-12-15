/**
 * Service pour la gestion de la collaboration (membres et commentaires)
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/lib/utils/errors'

export type ProjectRole = 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'

export interface AddProjectMemberInput {
  projectId: string
  userId: string
  role: ProjectRole
}

export interface CreateCommentInput {
  memoireSectionId: string
  authorId: string
  content: string
  parentCommentId?: string
}

export class CollaborationService {
  /**
   * Vérifie le rôle d'un utilisateur sur un projet
   */
  async getUserRole(projectId: string, userId: string): Promise<ProjectRole> {
    // Le propriétaire du projet a toujours le rôle OWNER
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId === userId) {
      return 'OWNER'
    }

    // Sinon, chercher dans les membres
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!member) {
      throw new UnauthorizedError('You are not a member of this project')
    }

    return member.role as ProjectRole
  }

  /**
   * Ajoute un membre à un projet
   */
  async addProjectMember(userId: string, input: AddProjectMemberInput): Promise<any> {
    // Vérifier que l'utilisateur qui ajoute est OWNER
    const requesterRole = await this.getUserRole(input.projectId, userId)
    if (requesterRole !== 'OWNER') {
      throw new UnauthorizedError('Only project owner can add members')
    }

    // Vérifier que l'utilisateur à ajouter existe
    const userToAdd = await prisma.user.findUnique({
      where: { id: input.userId },
    })

    if (!userToAdd) {
      throw new NotFoundError('User', input.userId)
    }

    // Ne pas permettre d'ajouter le propriétaire comme membre (il l'est déjà)
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { userId: true },
    })

    if (project?.userId === input.userId) {
      throw new ValidationError('Project owner is already a member with OWNER role')
    }

    // Créer ou mettre à jour le membre
    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.userId,
        },
      },
      create: input,
      update: {
        role: input.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return member
  }

  /**
   * Récupère tous les membres d'un projet
   */
  async getProjectMembers(projectId: string, requesterUserId: string): Promise<any[]> {
    // Vérifier que le demandeur a accès au projet
    await this.getUserRole(projectId, requesterUserId)

    // Récupérer le propriétaire
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    // Récupérer les membres
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Combiner propriétaire et membres
    const allMembers = [
      {
        id: `${projectId}-${project.userId}`,
        projectId,
        userId: project.userId,
        role: 'OWNER' as ProjectRole,
        user: project.user,
        createdAt: project.createdAt,
      },
      ...members.map((m) => ({
        ...m,
        role: m.role as ProjectRole,
      })),
    ]

    return allMembers
  }

  /**
   * Crée un commentaire sur une section
   */
  async createComment(userId: string, input: CreateCommentInput): Promise<any> {
    // Vérifier que la section existe
    const section = await prisma.memoireSection.findUnique({
      where: { id: input.memoireSectionId },
      include: {
        memoire: {
          include: {
            project: true,
          },
        },
      },
    })

    if (!section) {
      throw new NotFoundError('MemoireSection', input.memoireSectionId)
    }

    // Vérifier que l'utilisateur a accès au projet (OWNER, CONTRIBUTOR, ou REVIEWER)
    await this.getUserRole(section.memoire.projectId, userId)

    // Si parentCommentId, vérifier qu'il existe et appartient à la même section
    if (input.parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: input.parentCommentId },
      })

      if (!parentComment || parentComment.memoireSectionId !== input.memoireSectionId) {
        throw new ValidationError('Parent comment does not belong to this section')
      }
    }

    // Créer le commentaire
    const comment = await prisma.comment.create({
      data: {
        memoireSectionId: input.memoireSectionId,
        authorId: userId,
        content: input.content,
        parentCommentId: input.parentCommentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return comment
  }

  /**
   * Récupère tous les commentaires d'une section
   */
  async getSectionComments(sectionId: string, requesterUserId: string): Promise<any[]> {
    // Vérifier que la section existe
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

    // Vérifier que l'utilisateur a accès au projet
    await this.getUserRole(section.memoire.projectId, requesterUserId)

    // Récupérer les commentaires (sans réponses)
    const comments = await prisma.comment.findMany({
      where: {
        memoireSectionId: sectionId,
        parentCommentId: null, // Commentaires de premier niveau uniquement
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return comments
  }

  /**
   * Valide une section (REVIEWER ou OWNER uniquement)
   */
  async validateSection(
    sectionId: string,
    userId: string
  ): Promise<any> {
    // Vérifier que la section existe
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

    // Vérifier le rôle (REVIEWER ou OWNER)
    const role = await this.getUserRole(section.memoire.projectId, userId)
    if (role !== 'REVIEWER' && role !== 'OWNER') {
      throw new UnauthorizedError('Only REVIEWER or OWNER can validate sections')
    }

    // Mettre à jour la section
    const updated = await prisma.memoireSection.update({
      where: { id: sectionId },
      data: {
        status: 'VALIDATED',
        validatedBy: userId,
        validatedAt: new Date(),
      },
    })

    return updated
  }
}

export const collaborationService = new CollaborationService()

