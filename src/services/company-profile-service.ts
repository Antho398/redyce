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

export interface MethodologyInput {
  writingStyle?: string
  writingTone?: string
  writingGuidelines?: string
  forbiddenWords?: string
  preferredTerms?: string
  websiteUrl?: string
}

export interface WorkMethodologyInput {
  workMethodology?: string
  siteOccupied?: string
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

  /**
   * Met à jour la méthodologie rédactionnelle
   */
  async updateMethodology(userId: string, data: MethodologyInput) {
    // Vérifier que le profil existe
    const profile = await this.getProfile(userId)

    if (!profile) {
      throw new NotFoundError('CompanyProfile', `for user ${userId}`)
    }

    // Mettre à jour uniquement les champs méthodologie
    const updated = await prisma.companyProfile.update({
      where: { userId },
      data: {
        writingStyle: data.writingStyle,
        writingTone: data.writingTone,
        writingGuidelines: data.writingGuidelines,
        forbiddenWords: data.forbiddenWords,
        preferredTerms: data.preferredTerms,
        websiteUrl: data.websiteUrl,
      },
    })

    return updated
  }

  /**
   * Met à jour la méthodologie de travail (phases chantier)
   */
  async updateWorkMethodology(userId: string, data: WorkMethodologyInput) {
    // Vérifier que le profil existe
    const profile = await this.getProfile(userId)

    if (!profile) {
      throw new NotFoundError('CompanyProfile', `for user ${userId}`)
    }

    // Mettre à jour uniquement les champs méthodologie de travail
    const updated = await prisma.companyProfile.update({
      where: { userId },
      data: {
        workMethodology: data.workMethodology,
        siteOccupied: data.siteOccupied,
      },
    })

    return updated
  }

  /**
   * Récupère la méthodologie pour injection dans le prompt IA
   */
  async getMethodologyForAI(userId: string): Promise<string> {
    const profile = await this.getProfile(userId)

    if (!profile) {
      return ''
    }

    const parts: string[] = []

    if (profile.writingStyle) {
      parts.push(`Style de rédaction : ${profile.writingStyle}`)
    }

    if (profile.writingTone) {
      parts.push(`Ton : ${profile.writingTone}`)
    }

    if (profile.writingGuidelines) {
      parts.push(`Consignes spécifiques :\n${profile.writingGuidelines}`)
    }

    if (profile.forbiddenWords) {
      parts.push(`Mots à éviter : ${profile.forbiddenWords}`)
    }

    if (profile.preferredTerms) {
      parts.push(`Vocabulaire privilégié : ${profile.preferredTerms}`)
    }

    return parts.join('\n\n')
  }
}

export const companyProfileService = new CompanyProfileService()

