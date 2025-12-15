/**
 * Service IA pour l'assistant de section
 * Génère des propositions contextuelles pour améliorer/compléter une section
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'

export type SectionAIAction = 'complete' | 'reformulate' | 'shorten' | 'extractRequirements'

export interface SectionAIRequest {
  projectId: string
  memoireId: string
  sectionId: string
  actionType: SectionAIAction
}

export interface SectionAIResponse {
  resultText: string
  citations: Array<{
    documentId: string
    documentName: string
    documentType: string
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
    const memo = await prisma.memoire.findUnique({
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
                  in: ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'AUTRE'],
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
        template: {
          select: {
            id: true,
            filePath: true,
            name: true,
            mimeType: true,
          },
        },
      },
    })

    if (!memo) {
      throw new NotFoundError('Memoire', request.memoireId)
    }

    if (memo.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this memo')
    }

    const section = memo.sections[0]
    if (!section) {
      throw new NotFoundError('MemoireSection', request.sectionId)
    }

    // Construire le contexte (inclut le template MODELE_MEMOIRE + profil entreprise)
    const context = await this.buildContext(userId, memo.project, section, memo.templateDocumentId, memo.template)

    // Vérifier si le contexte est suffisant
    const hasDocuments = context.documents.length > 0
    const hasTemplate = context.template && context.template.trim().length > 0
    const hasCompanyProfile =
      context.companyProfile?.companyName && context.companyProfile.companyName.trim().length > 0

    // Si vraiment aucun contexte disponible (ni documents, ni template, ni profil entreprise), le contexte est insuffisant
    if (!hasDocuments && !hasTemplate && !hasCompanyProfile) {
      throw BusinessErrors.IA_INSUFFICIENT_CONTEXT
    }

    // Construire le prompt selon l'action
    const prompt = this.buildPrompt(request, section, context)

    // Générer la réponse
    const response = await aiClient.generateResponse(
      {
        system: this.getSystemPrompt(request.actionType),
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2000,
      }
    )

    // Extraire les citations depuis le contexte
    const citations = this.extractCitations(context.documents)

    return {
      resultText: response.content,
      citations,
    }
  }

  /**
   * Construit le contexte complet (template + exigences + documents sources + profil entreprise)
   */
  private async buildContext(userId: string, project: any, section: any, templateDocumentId: string, templateDoc: any) {
    // Récupérer les exigences pertinentes
    const relevantRequirements = project.requirements || []

    // Récupérer le template MODELE_MEMOIRE (extrait des titres/questions)
    let templateExtract = ''
    try {
      if (templateDoc && templateDoc.filePath) {
        // V1 simple : récupérer le document template depuis la DB pour voir s'il a une analyse
        const templateDocument = await prisma.document.findUnique({
          where: { id: templateDocumentId },
          include: {
            analyses: {
              where: { status: 'completed' },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (templateDocument && templateDocument.analyses.length > 0) {
          // Utiliser le texte extrait de l'analyse si disponible
          const analysis = templateDocument.analyses[0]
          const result = analysis.result as any
          templateExtract = result.extractedContent?.text || result.text || ''
          templateExtract = templateExtract.substring(0, 3000)
        } else {
          // Fallback : lire directement le fichier (V1 simple)
          try {
            const buffer = await fileStorage.readFile(templateDoc.filePath)
            if (buffer) {
              const text = buffer.toString('utf-8')
              templateExtract = text.substring(0, 3000)
            }
          } catch (fileError) {
            console.warn('Could not read template file:', fileError)
          }
        }
      }
    } catch (error) {
      console.warn('Could not load template extract:', error)
    }

    // Récupérer les extraits de documents sources (AE, RC, CCAP, CCTP, DPGF, AUTRE)
    // Limiter la taille totale pour éviter de dépasser les limites du modèle
    const MAX_TOTAL_EXTRACTS = 15000 // Limite totale pour tous les documents
    let totalExtractsSize = 0

    const documentExtracts = project.documents
      .filter((doc: any) => 
        doc.documentType && 
        ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'AUTRE'].includes(doc.documentType)
      )
      .map((doc: any) => {
        let extract = ''
        
        // Si analyse disponible, utiliser le texte extrait
        if (doc.analyses.length > 0) {
          const analysis = doc.analyses[0]
          const result = analysis.result as any
          extract = result.extractedContent?.text || result.text || ''
        }
        
        // Si pas d'analyse, utiliser un placeholder
        if (!extract) {
          extract = `[Document ${doc.documentType}: ${doc.name}]`
        }

        // Limiter à 2000 caractères par document, mais ajuster si on approche de la limite totale
        const remaining = MAX_TOTAL_EXTRACTS - totalExtractsSize
        const maxPerDoc = Math.min(2000, remaining)
        const limitedExtract = extract.substring(0, maxPerDoc)
        totalExtractsSize += limitedExtract.length

        return {
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          extract: limitedExtract,
        }
      })
      .filter((doc: any) => doc.extract.length > 0) // Ne garder que les documents avec contenu
      .slice(0, 10) // Limiter à 10 documents maximum

    // Récupérer le profil entreprise de l'utilisateur
    let companyProfile = {
      companyName: '',
      description: '',
      activities: '',
      workforce: '',
      equipment: '',
      qualitySafety: '',
      references: '',
    }

    try {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId },
      })

      if (profile) {
        companyProfile = {
          companyName: profile.companyName || '',
          description: profile.description || '',
          activities: profile.activities || '',
          workforce: profile.workforce || '',
          equipment: profile.equipment || '',
          qualitySafety: profile.qualitySafety || '',
          references: profile.references || '',
        }
      }
    } catch (error) {
      console.warn('Could not load company profile:', error)
    }

    return {
      template: templateExtract,
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
      complete: 'Génère un brouillon de réponse complet pour cette section en utilisant le contexte fourni (template, documents sources, exigences). Si certaines informations manquent, indique-le clairement.',
      reformulate: 'Reformule le contenu existant pour le rendre plus professionnel, clair et adapté au contexte. Conserve toutes les informations importantes.',
      shorten: 'Raccourcis le contenu existant tout en conservant toutes les informations essentielles. Sois concis sans perdre de détails importants.',
      extractRequirements: 'Extrais et liste les exigences pertinentes pour cette section depuis les documents sources. Pour chaque exigence, indique le document source (nom + type). Ne crée jamais d\'exigences qui ne sont pas présentes dans les sources.',
    }

    let prompt = `${actionInstructions[request.actionType]}\n\n`

    prompt += `\n## Section à traiter\n`
    prompt += `Titre: ${section.title}\n`
    if (section.question) {
      prompt += `Question: ${section.question}\n`
    }
    if (section.content && section.content.trim()) {
      prompt += `Contenu actuel:\n${section.content}\n`
    } else {
      prompt += `Contenu actuel: (vide)\n`
    }

    // Ajouter le template MODELE_MEMOIRE
    if (context.template) {
      prompt += `\n## Template mémoire client (structure attendue)\n`
      prompt += `${context.template}\n`
    }

    // Ajouter les extraits de documents sources
    if (context.documents.length > 0) {
      prompt += `\n## Documents sources du projet\n`
      context.documents.forEach((doc: any, idx: number) => {
        prompt += `\n### Document ${idx + 1}: ${doc.name} (Type: ${doc.type})\n`
        prompt += `${doc.extract}\n`
        prompt += `[Source: Document ID ${doc.id}, Type ${doc.type}]\n`
      })
    } else {
      prompt += `\n## Documents sources\n`
      prompt += `Aucun document source trouvé dans le projet (types: AE, RC, CCAP, CCTP, DPGF, AUTRE).\n`
      prompt += `⚠️ Information manquante : Pour générer un contenu de qualité, veuillez uploader les documents sources du projet.\n`
    }

    // Ajouter les exigences pertinentes si disponible
    if (context.requirements.length > 0) {
      prompt += `\n## Exigences extraites du projet\n`
      context.requirements.slice(0, 15).forEach((req: any, idx: number) => {
        prompt += `${idx + 1}. [${req.code || 'REQ-' + idx}] ${req.title}\n`
        if (req.description) {
          prompt += `   ${req.description.substring(0, 300)}\n`
        }
        if (req.documentId) {
          prompt += `   Source: Document ${req.documentId}\n`
        }
      })
    }

    // Ajouter le profil entreprise si disponible
    const hasCompanyProfile =
      context.companyProfile?.companyName && context.companyProfile.companyName.trim().length > 0

    if (hasCompanyProfile) {
      prompt += `\n## Profil entreprise\n`
      prompt += `Nom de l'entreprise: ${context.companyProfile.companyName}\n`
      if (context.companyProfile.description) {
        prompt += `Description: ${context.companyProfile.description}\n`
      }
      if (context.companyProfile.activities) {
        prompt += `Activités/Spécialités: ${context.companyProfile.activities}\n`
      }
      if (context.companyProfile.workforce) {
        prompt += `Effectifs: ${context.companyProfile.workforce}\n`
      }
      if (context.companyProfile.equipment) {
        prompt += `Moyens matériels: ${context.companyProfile.equipment}\n`
      }
      if (context.companyProfile.qualitySafety) {
        prompt += `Qualité/Sécurité/Environnement: ${context.companyProfile.qualitySafety}\n`
      }
      if (context.companyProfile.references) {
        prompt += `Références chantiers: ${context.companyProfile.references}\n`
      }
    } else {
      prompt += `\n## Profil entreprise\n`
      prompt += `⚠️ Informations entreprise manquantes. Les réponses seront génériques.`
      prompt += `\nPour améliorer la qualité des réponses, veuillez compléter votre profil entreprise dans les paramètres.`
    }

    prompt += `\n## Instructions importantes\n`
    prompt += `- Toujours citer les sources utilisées (document nom + type)\n`
    prompt += `- Si le contexte est insuffisant, indiquer clairement "Information manquante" et suggérer quels documents uploader\n`
    prompt += `- Ne jamais inventer d'exigences non présentes dans les sources\n`
    if (hasCompanyProfile) {
      prompt += `- Utiliser UNIQUEMENT les informations du profil entreprise fourni. Ne jamais inventer d'informations sur l'entreprise.\n`
    } else {
      prompt += `- Ne pas inventer d'informations sur l'entreprise. Si nécessaire, indiquer "Informations entreprise manquantes".\n`
    }
    prompt += `- Le résultat doit être un brouillon que l'utilisateur peut modifier\n`
    prompt += `\nGénère maintenant la proposition pour cette section.`

    return prompt
  }

  /**
   * Retourne le prompt système selon l'action
   */
  private getSystemPrompt(action: SectionAIAction): string {
    const basePrompt = 'Tu es un assistant expert en rédaction de mémoires techniques pour le bâtiment et les travaux publics. Tu aides les entreprises à répondre aux appels d\'offres.'

    const actionPrompts = {
      complete: 'Tu génères un brouillon de réponse complet pour la section demandée en utilisant le template mémoire client, les documents sources (AE, RC, CCAP, CCTP, DPGF) et les exigences extraites.',
      reformulate: 'Tu reformules le contenu existant pour le rendre plus professionnel, clair et adapté au contexte du mémoire technique.',
      shorten: 'Tu raccourcis le contenu en conservant toutes les informations essentielles. Sois concis sans perdre de détails importants.',
      extractRequirements: 'Tu extrais et listes les exigences pertinentes depuis les documents sources. Pour chaque exigence, tu cites le document source (nom + type). Tu ne crées JAMAIS d\'exigences qui ne sont pas présentes dans les sources.',
    }

    return `${basePrompt} ${actionPrompts[action]} Tu utilises UNIQUEMENT les informations fournies dans le contexte (template, documents sources, exigences, profil entreprise). Si des informations manquent, tu indiques clairement "Information manquante" et suggères quels documents uploader ou quelles informations compléter. Ne JAMAIS inventer d'informations sur l'entreprise.`
  }

  /**
   * Extrait les citations depuis les documents utilisés
   */
  private extractCitations(documents: any[]): Array<{
    documentId: string
    documentName: string
    documentType: string
    page?: number
    quote?: string
  }> {
    return documents.map((doc) => ({
      documentId: doc.id,
      documentName: doc.name,
      documentType: doc.type,
      quote: doc.extract.substring(0, 200) + (doc.extract.length > 200 ? '...' : ''),
    }))
  }
}

export const sectionAIService = new SectionAIService()
