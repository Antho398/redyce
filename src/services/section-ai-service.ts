/**
 * Service IA pour l'assistant de section
 * Génère des propositions contextuelles pour améliorer/compléter une section
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { BusinessErrors } from '@/lib/utils/business-errors'
import { fileStorage } from '@/lib/documents/storage'
import { UsageTracker } from './usage-tracker'
import { createGenerationContext, type GenerationContext } from '@/lib/utils/generation-context'

export type SectionAIAction = 'complete' | 'reformulate' | 'shorten' | 'enrich'

export interface SectionAIRequest {
  projectId: string
  memoireId: string
  sectionId: string
  actionType: SectionAIAction
  responseLength?: 'short' | 'standard' | 'detailed'
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
          include: {
            requirementLinks: {
              include: {
                requirement: true,
              },
              orderBy: { relevance: 'desc' },
            },
          },
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

    // Déterminer maxTokens selon la longueur souhaitée
    const maxTokensMap = {
      short: 1000,
      standard: 2000,
      detailed: 3000,
    }
    const maxTokens = request.responseLength ? maxTokensMap[request.responseLength] : maxTokensMap.standard

    // Générer la réponse
    const response = await aiClient.generateResponse(
      {
        system: this.getSystemPrompt(request.actionType),
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens,
      }
    )

    // Enregistrer la consommation IA
    if (response.metadata?.inputTokens && response.metadata?.outputTokens) {
      await UsageTracker.recordUsage(
        userId,
        response.metadata.model || 'gpt-4o-mini',
        response.metadata.inputTokens,
        response.metadata.outputTokens,
        `section_${request.actionType}`,
        {
          projectId: request.projectId,
        }
      )
    }

    // Extraire les citations depuis le contexte
    const citations = this.extractCitations(context.documents)

    // Créer et stocker le contexte de génération pour permettre la détection de sections obsolètes
    try {
      const generationContext = createGenerationContext({
        companyProfile: context.companyProfile as Record<string, unknown>,
        requirements: context.requirements.map((r: any) => ({
          id: r.id,
          title: r.title || r.code,
          content: r.description,
        })),
        companyDocs: context.documents.map((d: any) => ({
          id: d.id,
          extractedContent: d.extract,
        })),
        question: section.question,
      })

      // Mettre à jour la section avec le contexte de génération
      await prisma.memoireSection.update({
        where: { id: request.sectionId },
        data: {
          generationContextJson: generationContext as any,
          generatedAt: new Date(),
        },
      })
    } catch (contextError) {
      // Ne pas bloquer si le stockage du contexte échoue
      console.warn('Could not store generation context:', contextError)
    }

    return {
      resultText: response.content,
      citations,
    }
  }

  /**
   * Construit le contexte complet (template + exigences + documents sources + profil entreprise)
   */
  private async buildContext(userId: string, project: any, section: any, templateDocumentId: string, templateDoc: any) {
    // Récupérer les exigences pertinentes pour cette section
    // Priorité 1 : Exigences liées à la section (via RequirementLink)
    // Priorité 2 : Toutes les exigences du projet (fallback)
    let relevantRequirements: any[] = []
    
    if (section.requirementLinks && section.requirementLinks.length > 0) {
      // Utiliser les exigences liées à la section (triées par pertinence)
      relevantRequirements = section.requirementLinks
        .map((link: any) => ({
          ...link.requirement,
          relevance: link.relevance,
        }))
        .sort((a: any, b: any) => (b.relevance || 0) - (a.relevance || 0))
    } else {
      // Fallback : utiliser toutes les exigences du projet
      relevantRequirements = project.requirements || []
    }

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
      workMethodology: '',
      siteOccupied: '',
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
          workMethodology: profile.workMethodology || '',
          siteOccupied: profile.siteOccupied || '',
        }
      }
    } catch (error) {
      console.warn('Could not load company profile:', error)
    }

    // Récupérer la méthodologie rédactionnelle
    let methodology = ''
    try {
      const { companyProfileService } = await import('./company-profile-service')
      methodology = await companyProfileService.getMethodologyForAI(userId)
    } catch (error) {
      console.warn('Could not load methodology:', error)
    }

    // Récupérer les documents de référence (mémoires passés, exemples)
    let referenceDocuments = ''
    try {
      const { methodologyDocumentService } = await import('./methodology-document-service')
      referenceDocuments = await methodologyDocumentService.getDocumentsForAIContext(userId)
    } catch (error) {
      console.warn('Could not load reference documents:', error)
    }

    return {
      template: templateExtract,
      requirements: relevantRequirements,
      documents: documentExtracts,
      companyProfile,
      methodology,
      referenceDocuments,
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
    const lengthInstructions = {
      short: 'Réponse courte : aller à l\'essentiel, chaque phrase doit apporter une information concrète. 500-800 caractères.',
      standard: 'Réponse standard : informations principales avec détails utiles. Chaque phrase doit apporter une information nouvelle. 800-1500 caractères.',
      detailed: 'Réponse détaillée : informations complètes avec tous les détails pertinents. Chaque phrase doit apporter une information nouvelle. 1500-2500 caractères.',
    }

    const actionInstructions = {
      complete: 'Génère une réponse professionnelle et structurée. COMMENCE DIRECTEMENT par le contenu (pas de titre, pas de reformulation de la question, pas de répétition du nom/lieu du projet). Utilise des phrases complètes et un ton professionnel. Structure avec des listes à puces pour les énumérations. Évite les paragraphes de conclusion génériques ("L\'organisation permettra...", "Cette approche garantit...").',
      reformulate: 'Reformule le contenu existant pour le rendre plus professionnel, clair et adapté au contexte. Conserve toutes les informations importantes. Texte continu, sans markdown.',
      shorten: 'Raccourcis le contenu existant tout en conservant toutes les informations essentielles. Sois concis sans perdre de détails importants. Texte continu, sans markdown.',
      enrich: 'Enrichis le contenu existant en ajoutant des détails, précisions techniques et informations complémentaires pertinentes issues des documents sources et du profil entreprise. Conserve la structure et le ton du texte original tout en le développant.',
    }

    const lengthInstruction = request.responseLength ? lengthInstructions[request.responseLength] : lengthInstructions.standard
    let prompt = `${actionInstructions[request.actionType]}\n\nLongueur souhaitée : ${lengthInstruction}\n\n`

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
      prompt += `IMPORTANT : Dans ce cas, utiliser uniquement les informations du template et du profil entreprise si disponibles. Ne pas inventer de données. Utiliser des formulations neutres et prudentes. Ne PAS mentionner l'absence de documents dans la réponse finale.\n`
    }

    // Ajouter les exigences pertinentes si disponible
    if (context.requirements.length > 0) {
      prompt += `\n## Exigences extraites du projet (à respecter dans la réponse)\n`
      prompt += `Ces exigences proviennent des documents AO (Appel d'Offres) et doivent être prises en compte pour répondre à cette section.\n`
      context.requirements.slice(0, 15).forEach((req: any, idx: number) => {
        const relevanceNote = req.relevance ? ` (Pertinence: ${Math.round(req.relevance * 100)}%)` : ''
        prompt += `${idx + 1}. [${req.code || 'REQ-' + (idx + 1)}] ${req.title}${relevanceNote}\n`
        if (req.description) {
          prompt += `   ${req.description.substring(0, 300)}${req.description.length > 300 ? '...' : ''}\n`
        }
        if (req.documentId) {
          prompt += `   Source: Document ${req.documentId}\n`
        }
      })
      prompt += `\nIMPORTANT : La réponse doit respecter ces exigences et y faire référence de manière naturelle et intégrée, sans les lister explicitement.\n`
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
      if (context.companyProfile.workMethodology) {
        prompt += `Méthodologie d'intervention: ${context.companyProfile.workMethodology}\n`
      }
      if (context.companyProfile.siteOccupied) {
        prompt += `Organisation en site occupé: ${context.companyProfile.siteOccupied}\n`
      }
    } else {
      prompt += `\n## Profil entreprise\n`
      prompt += `Informations entreprise non disponibles. Utiliser uniquement les informations des documents sources et du template. Ne pas inventer de données. Utiliser des formulations neutres et prudentes si nécessaire.`
    }

    // Ajouter la méthodologie rédactionnelle si disponible
    if (context.methodology && context.methodology.trim().length > 0) {
      prompt += `\n\n## Méthodologie rédactionnelle de l'entreprise\n`
      prompt += `IMPORTANT : Respecter strictement cette méthodologie lors de la génération de la réponse.\n\n`
      prompt += context.methodology
      prompt += `\n`
    }

    // Ajouter les documents de référence si disponibles
    if (context.referenceDocuments && context.referenceDocuments.trim().length > 0) {
      prompt += `\n\n## Documents de référence (exemples de mémoires passés)\n`
      prompt += `Ces documents illustrent le style et le ton attendus. S'en inspirer pour la structure et le vocabulaire.\n\n`
      prompt += context.referenceDocuments
      prompt += `\n`
    }

    prompt += `\n## RÈGLES DE RÉDACTION\n`
    prompt += `\n### CE QUI EST INTERDIT :\n`
    prompt += `- Titres ou en-têtes ("ITEM 1", "1. Moyens humains", etc.)\n`
    prompt += `- Reformuler la question en introduction\n`
    prompt += `- Répéter le nom du projet, le lieu ou le type de travaux (déjà connus du lecteur)\n`
    prompt += `- Paragraphes de conclusion génériques ("Cette organisation permettra...", "L'ensemble de ces moyens garantit...")\n`
    prompt += `- Expressions creuses : "de manière efficace", "de qualité", "permettant d'assurer", "en vue de"\n`
    prompt += `\n### CE QUI EST ATTENDU :\n`
    prompt += `- Commencer directement par le contenu informatif\n`
    prompt += `- Rédiger en phrases complètes avec un ton professionnel\n`
    prompt += `- Utiliser des listes à puces (tirets -) pour les énumérations (équipe, matériel, étapes)\n`
    prompt += `- Chaque phrase ou item doit apporter une information concrète\n`
    prompt += `- Vocabulaire technique BTP précis\n`
    prompt += `\n### FORMAT :\n`
    prompt += `- Texte brut avec tirets (-) pour les listes, pas d'autre markdown\n`
    prompt += `- Ne jamais inventer de données chiffrées absentes des sources\n`
    prompt += `- Ne jamais mentionner l'IA ou l'absence d'information\n`
    if (hasCompanyProfile) {
      prompt += `- Utiliser uniquement les informations du profil entreprise fourni\n`
    } else {
      prompt += `- Rester factuel, ne pas inventer d'informations sur l'entreprise\n`
    }
    prompt += `\n## EXEMPLE DE BONNE RÉPONSE (question sur les effectifs) :\n`
    prompt += `"L'équipe affectée au chantier se compose de :\n\n- M. Adnan BALIKCI, conducteur de travaux et gérant, assure le pilotage global et les relations avec la maîtrise d'œuvre\n- M. Daniel PÊCHEUR, assistant de chantier et métreur, coordonne les approvisionnements et le suivi quantitatif\n- 2 chefs de chantiers encadrent les équipes terrain\n- 8 ouvriers spécialisés en façade et échafaudage\n\nEffectif total : 12 personnes."`
    prompt += `\n\n## EXEMPLE DE MAUVAISE RÉPONSE (à éviter) :\n`
    prompt += `"ITEM 1 Moyens humains affectés au chantier :\n\nPour la rénovation des 8 logements à Thizy les Bourgs, les effectifs seront constitués comme suit : [...] L'organisation des équipes sera structurée de manière à assurer une répartition efficace des tâches."`
    prompt += `\n\nGénère maintenant la réponse.`

    return prompt
  }

  /**
   * Retourne le prompt système selon l'action
   */
  private getSystemPrompt(action: SectionAIAction): string {
    const basePrompt = `Tu es un rédacteur technique BTP expérimenté, spécialisé dans les mémoires techniques pour appels d'offres. Tu rédiges de manière professionnelle, structurée et informative.`

    const actionPrompts = {
      complete: 'Génère une réponse professionnelle et bien structurée.',
      reformulate: 'Reformule le contenu pour le rendre plus professionnel et clair.',
      shorten: 'Raccourcis le contenu en conservant les informations essentielles.',
      enrich: 'Enrichis le contenu existant avec des détails et précisions supplémentaires.',
    }

    return `${basePrompt} ${actionPrompts[action]}

STYLE DE RÉDACTION :
- Phrases complètes, ton professionnel
- Listes à puces (tirets -) pour les énumérations
- Vocabulaire technique BTP précis
- Chaque phrase apporte une information concrète

À ÉVITER ABSOLUMENT :
- Titres ou en-têtes ("ITEM 1", "1. Moyens humains")
- Reformuler la question en début de réponse
- Répéter le nom du projet, le lieu, le type de travaux
- Paragraphes de conclusion vides ("Cette organisation permettra...", "L'ensemble garantit...")
- Expressions creuses : "de manière efficace", "de qualité", "permettant d'assurer"

FORMAT : Texte brut avec tirets (-) pour les listes, pas d'autre markdown.`
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
