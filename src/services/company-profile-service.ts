/**
 * Service pour la gestion du profil entreprise
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

export interface CompanyProfileInput {
  companyName: string
  description?: string
  activities?: string
  workforce?: string
  equipment?: string
  qualitySafety?: string
  references?: string
}

export class CompanyProfileService {
  /**
   * Récupère le profil entreprise d'un utilisateur
   */
  async getProfile(userId: string) {
    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
    })

    return profile
  }

  /**
   * Crée ou met à jour le profil entreprise (upsert)
   */
  async upsertProfile(userId: string, data: CompanyProfileInput) {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundError('User', userId)
    }

    // Upsert le profil
    const profile = await prisma.companyProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    })

    return profile
  }
}

export const companyProfileService = new CompanyProfileService()

