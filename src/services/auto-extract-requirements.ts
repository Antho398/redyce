/**
 * Service pour l'extraction automatique des exigences
 * Déclenche l'extraction silencieusement en arrière-plan
 */

import { prisma } from '@/lib/prisma/client'
import { requirementService } from './requirement-service'

/**
 * Déclenche l'extraction automatique des exigences pour un projet
 * Fonctionne en arrière-plan, ne bloque pas l'UX
 * 
 * @param projectId ID du projet
 * @param userId ID de l'utilisateur
 */
export async function autoExtractRequirements(projectId: string, userId: string): Promise<void> {
  // Exécuter en arrière-plan sans bloquer
  setImmediate(async () => {
    try {
      // Récupérer les documents du projet de type AE, RC, CCAP, CCTP, DPGF
      const documents = await prisma.document.findMany({
        where: {
          projectId,
          documentType: {
            in: ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF'],
          },
          status: 'processed', // Seulement les documents traités
        },
        include: {
          analyses: {
            where: {
              status: 'completed',
              analysisType: 'extraction',
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (documents.length === 0) {
        // Pas de documents AO traités, rien à faire
        return
      }

      // Extraire les exigences de chaque document
      for (const document of documents) {
        try {
          if (document.analyses.length > 0 && document.analyses[0].result) {
            await requirementService.extractRequirements(document.id, userId)
          }
        } catch (error) {
          console.error(`[autoExtractRequirements] Error extracting requirements from document ${document.id}:`, error)
          // Continuer avec les autres documents même en cas d'erreur
        }
      }
    } catch (error) {
      console.error('[autoExtractRequirements] Error:', error)
      // Ne pas propager l'erreur, l'extraction est silencieuse
    }
  })
}


