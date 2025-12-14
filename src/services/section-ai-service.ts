/**
 * Service IA pour l'assistant de section
 * Génère des propositions contextuelles pour améliorer/compléter une section
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

export type SectionAIAction = 'improve' | 'rewrite' | 'complete' | 'explain'

export interface SectionAIRequest {
  memoireId: string
  sectionId: string
  action: SectionAIAction
  tone?: 'professional' | 'technical' | 'concise' | 'detailed'
  length?: 'short' | 'medium' | 'long'
}

export interface SectionAIResponse {
  proposition: string
  citations: Array<{
    documentId: string
    documentName: string
    page?: number
    quote?: string
  }>
}

export class SectionAIService {
  /**
   * Génère une proposition pour une section avec contexte complet
   */
  async generateSectionProposal(
    userId: string,
    request: SectionAIRequest
  ): Promise<SectionAIResponse> {
    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memo = await prisma.technicalMemo.findUnique({
      where: { id: request.memoireId },
      include: {
        project: {
          include: {
            requirements: {
              take: 20, // Limiter à 20 exigences les plus récentes
              orderBy: { createdAt: 'desc' },
            },
            documents: {
              where: {
                status: 'processed',
                documentType: {
                  in: ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF'],
                },
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
              take: 10, // Limiter à 10 documents
            },
          },
        },
        sections: {
          where: { id: request.sectionId },
        },
      },
    })

    if (!memo) {
      throw new NotFoundError('TechnicalMemo', request.memoireId)
    }

    if (memo.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    const section = memo.sections[0]
    if (!section) {
      throw new NotFoundError('MemoireSection', request.sectionId)
    }

    // Construire le contexte
    const context = await this.buildContext(memo.project, section)

    // Construire le prompt selon l'action
    const prompt = this.buildPrompt(request, section, context)

    // Générer la réponse
    const response = await aiClient.generateResponse(
      {
        system: this.getSystemPrompt(request.action),
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: this.getMaxTokens(request.length),
      }
    )

    // TODO: Tracker l'usage IA si nécessaire
    // await usageTracker.trackUsage({ ... })

    // Extraire les citations depuis le contexte
    const citations = this.extractCitations(context.documents)

    return {
      proposition: response.content,
      citations,
    }
  }

  /**
   * Construit le contexte complet (exigences + documents)
   */
  private async buildContext(project: any, section: any) {
    // Récupérer les exigences pertinentes
    const relevantRequirements = project.requirements || []

    // Récupérer les extraits de documents
    const documentExtracts = project.documents
      .filter((doc: any) => doc.analyses.length > 0)
      .map((doc: any) => {
        const analysis = doc.analyses[0]
        const result = analysis.result as any
        const text = result.extractedContent?.text || result.text || ''
        
        return {
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          extract: text.substring(0, 2000), // Limiter à 2000 caractères par document
        }
      })

    // Profil entreprise (pour l'instant, on utilise les infos du projet)
    const companyProfile = {
      name: project.name,
      description: project.description || '',
    }

    return {
      requirements: relevantRequirements,
      documents: documentExtracts,
      companyProfile,
    }
  }

  /**
   * Construit le prompt selon l'action
   */
  private buildPrompt(
    request: SectionAIRequest,
    section: any,
    context: any
  ): string {
    const actionInstructions = {
      improve: 'Améliore le contenu suivant en le rendant plus clair, professionnel et complet.',
      rewrite: 'Réécris complètement le contenu suivant en conservant les informations essentielles.',
      complete: 'Complète le contenu suivant en ajoutant les informations manquantes basées sur le contexte.',
      explain: 'Explique en détail le sujet de cette section en utilisant le contexte fourni.',
    }

    const toneInstructions = {
      professional: 'Utilise un ton professionnel et formel.',
      technical: 'Utilise un vocabulaire technique précis.',
      concise: 'Sois concis et va droit au but.',
      detailed: 'Fournis des détails complets et approfondis.',
    }

    const lengthInstructions = {
      short: 'Réponse courte (100-200 mots).',
      medium: 'Réponse de longueur moyenne (300-500 mots).',
      long: 'Réponse détaillée (600-1000 mots).',
    }

    let prompt = `${actionInstructions[request.action]}\n\n`

    if (request.tone) {
      prompt += `${toneInstructions[request.tone]}\n`
    }

    if (request.length) {
      prompt += `${lengthInstructions[request.length]}\n`
    }

    prompt += `\n## Section à traiter\n`
    prompt += `Titre: ${section.title}\n`
    if (section.question) {
      prompt += `Question: ${section.question}\n`
    }
    if (section.content) {
      prompt += `Contenu actuel:\n${section.content}\n`
    } else {
      prompt += `Contenu actuel: (vide)\n`
    }

    // Ajouter les exigences pertinentes
    if (context.requirements.length > 0) {
      prompt += `\n## Exigences du projet\n`
      context.requirements.slice(0, 10).forEach((req: any, idx: number) => {
        prompt += `${idx + 1}. [${req.code || 'REQ-' + idx}] ${req.title}\n`
        if (req.description) {
          prompt += `   ${req.description.substring(0, 200)}...\n`
        }
      })
    }

    // Ajouter les extraits de documents
    if (context.documents.length > 0) {
      prompt += `\n## Documents sources\n`
      context.documents.forEach((doc: any, idx: number) => {
        prompt += `\n### Document ${idx + 1}: ${doc.name} (${doc.type})\n`
        prompt += `${doc.extract.substring(0, 1000)}...\n`
      })
    }

    // Ajouter le profil entreprise
    if (context.companyProfile.name) {
      prompt += `\n## Contexte entreprise\n`
      prompt += `Nom: ${context.companyProfile.name}\n`
      if (context.companyProfile.description) {
        prompt += `Description: ${context.companyProfile.description}\n`
      }
    }

    prompt += `\nGénère maintenant la proposition pour cette section.`

    return prompt
  }

  /**
   * Retourne le prompt système selon l'action
   */
  private getSystemPrompt(action: SectionAIAction): string {
    const basePrompt = 'Tu es un assistant expert en rédaction de mémoires techniques pour le bâtiment.'

    const actionPrompts = {
      improve: 'Tu améliores le contenu existant en le rendant plus clair, professionnel et complet.',
      rewrite: 'Tu réécris complètement le contenu en conservant les informations essentielles.',
      complete: 'Tu complètes le contenu en ajoutant les informations manquantes basées sur le contexte.',
      explain: 'Tu expliques en détail le sujet en utilisant le contexte fourni.',
    }

    return `${basePrompt} ${actionPrompts[action]} Tu utilises le contexte fourni (exigences, documents sources) pour enrichir ta réponse.`
  }

  /**
   * Retourne le nombre max de tokens selon la longueur demandée
   */
  private getMaxTokens(length?: string): number {
    switch (length) {
      case 'short':
        return 500
      case 'long':
        return 2000
      default:
        return 1000
    }
  }

  /**
   * Extrait les citations depuis les documents utilisés
   */
  private extractCitations(documents: any[]): Array<{
    documentId: string
    documentName: string
    page?: number
    quote?: string
  }> {
    return documents.map((doc) => ({
      documentId: doc.id,
      documentName: doc.name,
      quote: doc.extract.substring(0, 200) + '...',
    }))
  }
}

export const sectionAIService = new SectionAIService()

