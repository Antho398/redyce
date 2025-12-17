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
    const lengthInstructions = {
      short: 'Réponse courte et concise : privilégier l\'essentiel, éviter les développements détaillés. 2-3 paragraphes maximum.',
      standard: 'Réponse standard : développement équilibré avec les informations principales. 3-5 paragraphes environ.',
      detailed: 'Réponse détaillée : développement complet avec toutes les informations pertinentes disponibles. 5-8 paragraphes environ.',
    }

    const actionInstructions = {
      complete: 'Génère une réponse strictement technique et opérationnelle pour cette section en utilisant le contexte fourni (template, documents sources, exigences). Fournis UNIQUEMENT le contenu factuel, sans introduction, conclusion ni phrases génériques. Texte précis, directement exploitable dans un dossier de consultation BTP. Privilégie les paragraphes continus. Utilise des listes à puces UNIQUEMENT pour des énumérations factuelles courtes (max 3-5 puces, max une liste par paragraphe, pas de sous-listes). Pas de markdown, pas de mention d\'IA, pas de remplissage.',
      reformulate: 'Reformule le contenu existant pour le rendre plus professionnel, clair et adapté au contexte. Conserve toutes les informations importantes. Texte continu, sans markdown.',
      shorten: 'Raccourcis le contenu existant tout en conservant toutes les informations essentielles. Sois concis sans perdre de détails importants. Texte continu, sans markdown.',
      extractRequirements: 'Extrais et liste les exigences pertinentes pour cette section depuis les documents sources. Pour chaque exigence, indique le document source (nom + type). Ne crée jamais d\'exigences qui ne sont pas présentes dans les sources.',
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
    } else {
      prompt += `\n## Profil entreprise\n`
      prompt += `Informations entreprise non disponibles. Utiliser uniquement les informations des documents sources et du template. Ne pas inventer de données. Utiliser des formulations neutres et prudentes si nécessaire.`
    }

    prompt += `\n## Instructions de rédaction - Mémoire technique BTP\n`
    prompt += `- Texte strictement technique et opérationnel, destiné à un professionnel du BTP\n`
    prompt += `- FOURNIR UNIQUEMENT le contenu de la réponse, SANS phrases d'introduction, de conclusion ou de présentation\n`
    prompt += `- Ne JAMAIS commencer par "Voici", "Nous vous proposons", "Notre entreprise", "Le présent document", "Il convient de", "Nous tenons à", "Afin de", "Dans le cadre de"\n`
    prompt += `- Supprimer TOUTES les phrases génériques, remplissages, formulations vagues ("nous pouvons", "il est possible", "de manière efficace", "de qualité")\n`
    prompt += `- Utiliser un vocabulaire précis et technique du secteur (chantier, phase, matériau, norme, procédure)\n`
    prompt += `- Réponse factuelle, précise et directement exploitable dans un dossier de consultation\n`
    prompt += `- Privilégier des phrases structurées en paragraphes continus. Listes à puces UNIQUEMENT pour énumérations factuelles courtes (max 3-5 puces, max une liste par paragraphe, pas de sous-listes)\n`
    prompt += `- Ne JAMAIS utiliser de symboles markdown (#, ##, **, *, etc.) : uniquement du texte brut\n`
    prompt += `- GESTION DES INFORMATIONS MANQUANTES : ne JAMAIS inventer de données chiffrées (effectifs, quantités, durées, coûts), organisationnelles (structures, procédures) ou techniques (équipements spécifiques) si elles ne sont pas dans les sources. Si une information est manquante, utiliser des formulations neutres et prudentes ("selon les besoins du chantier", "conformément aux prescriptions", "en fonction des spécifications") plutôt que d'inventer des données précises. Ne PAS mentionner explicitement l'absence ni afficher de messages système dans la réponse finale.\n`
    prompt += `- Ne JAMAIS révéler que le contenu est généré par IA (pas de mention explicite ou implicite)\n`
    prompt += `- Ne JAMAIS inventer d'informations : utiliser UNIQUEMENT les données fournies dans le contexte\n`
    if (hasCompanyProfile) {
      prompt += `- Utiliser UNIQUEMENT les informations du profil entreprise fourni. Ne jamais inventer d'informations sur l'entreprise.\n`
    } else {
      prompt += `- Ne pas inventer d'informations sur l'entreprise. Rester factuel et neutre en utilisant des formulations prudentes si nécessaire.\n`
    }
    prompt += `\nGénère maintenant le contenu technique et opérationnel de la réponse pour cette section, en respectant strictement toutes les règles de rédaction (suppression des phrases génériques, style technique BTP, contenu factuel et précis).`

    return prompt
  }

  /**
   * Retourne le prompt système selon l'action
   */
  private getSystemPrompt(action: SectionAIAction): string {
    const basePrompt = 'Tu es un expert en rédaction de mémoires techniques pour le bâtiment et les travaux publics. Tu rédiges du contenu strictement technique et opérationnel, factuel et précis, directement utilisable dans un dossier de consultation professionnel.'

    const actionPrompts = {
      complete: 'Tu génères le contenu de réponse technique et opérationnel pour la section demandée en utilisant le template mémoire client, les documents sources (AE, RC, CCAP, CCTP, DPGF) et les exigences extraites. Le contenu doit être factuel, précis, directement exploitable, sans phrases génériques ni remplissage. Ne jamais inventer de données chiffrées ou organisationnelles si elles ne sont pas dans les sources. Pour les informations manquantes, utiliser des formulations neutres et prudentes sans mentionner l\'absence ni afficher de messages système.',
      reformulate: 'Tu reformules le contenu existant pour le rendre strictement technique et opérationnel, en supprimant toute phrase générique ou remplissage. Conserve toutes les informations factuelles importantes.',
      shorten: 'Tu raccourcis le contenu existant en conservant uniquement les informations essentielles factuelles. Supprime toutes les phrases génériques ou de remplissage. Sois concis et précis.',
      extractRequirements: 'Tu extrais et listes les exigences pertinentes depuis les documents sources. Pour chaque exigence, tu cites le document source (nom + type). Tu ne crées JAMAIS d\'exigences qui ne sont pas présentes dans les sources.',
    }

    return `${basePrompt} ${actionPrompts[action]} 

RÈGLES DE RÉDACTION STRICTES - MÉMOIRE TECHNIQUE BTP :

1. STYLE ET TON :
- Texte strictement technique et opérationnel, destiné à un professionnel du BTP.
- Supprimer TOUTES les phrases génériques, remplissages, formules de politesse ou transitions vides.
- Éviter les formulations vagues ("nous pouvons", "il est possible", "de manière efficace", "de qualité").
- Utiliser un vocabulaire précis et technique du secteur (chantier, phase, matériau, norme, procédure).

2. STRUCTURE :
- FOURNIR UNIQUEMENT le contenu de la réponse, SANS introduction ni conclusion.
- Ne JAMAIS commencer par "Voici", "Nous vous proposons", "Notre entreprise", "Le présent document", "Il convient de", "Nous tenons à", "Nous souhaitons", "Afin de", "Dans le cadre de".
- Privilégier des phrases structurées en paragraphes continus pour la majorité du contenu.
- Utiliser des listes à puces UNIQUEMENT pour des énumérations factuelles courtes (effectifs par phase, équipements, rôles) : max une liste par paragraphe, max 3-5 puces, pas de sous-listes.
- Ne JAMAIS utiliser de symboles markdown (#, ##, **, *, etc.) : uniquement du texte brut.

3. CONTENU :
- Réponse factuelle, précise et directement exploitable dans un dossier de consultation.
- Utiliser UNIQUEMENT les informations fournies dans le contexte (template, documents sources, exigences, profil entreprise).
- Citer les références techniques (normes, documents, procédures) si disponibles dans les sources.
- GESTION DES INFORMATIONS MANQUANTES :
  * Ne JAMAIS inventer de données chiffrées (effectifs, quantités, durées, coûts) si elles ne sont pas dans les sources.
  * Ne JAMAIS inventer d'informations organisationnelles (structures, procédures, équipements spécifiques) si elles ne sont pas documentées.
  * Si une information est manquante : utiliser des formulations neutres et prudentes ("selon les besoins du chantier", "conformément aux prescriptions", "en fonction des spécifications") plutôt que des données précises inexistantes.
  * Ne PAS mentionner explicitement l'absence d'information ("Information non disponible", "À compléter", "Non renseigné").
  * Ne PAS afficher de messages système ou demandes de documents dans la réponse finale.
  * Rester crédible en restant factuel sur ce qui est disponible, sans inventer ce qui manque.

4. INTERDICTIONS ABSOLUES :
- Ne JAMAIS révéler que le contenu est généré par IA ou automatiquement (pas de mention explicite ou implicite).
- Ne JAMAIS utiliser de phrases passe-partout ou génériques ("répondre aux besoins", "s'adapter aux exigences", "garantir la qualité").
- Ne JAMAIS inventer d'informations sur l'entreprise, le projet, les matériaux, équipements, effectifs, durées ou coûts.
- Ne JAMAIS ajouter de justifications ou d'explications sur la méthodologie de rédaction.
- Ne JAMAIS afficher de messages système, avertissements ou demandes de documents dans la réponse finale.
- Ne JAMAIS afficher de messages système, avertissements ou demandes de documents dans la réponse finale.

5. RÉSULTAT ATTENDU :
- Texte crédible dans un dossier de consultation professionnel.
- Contenu directement intégrable dans Word, sans retouche.
- Style rédactionnel adapté au BTP : factuel, précis, opérationnel.`
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
