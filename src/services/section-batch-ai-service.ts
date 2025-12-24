/**
 * Service IA pour la génération par lot avec planification
 * Génère plusieurs sections d'un même item en 2 phases :
 * - Phase 1 : Planification (analyse des questions et répartition du contenu)
 * - Phase 2 : Génération (génère chaque réponse selon le plan)
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { fileStorage } from '@/lib/documents/storage'
import { UsageTracker } from './usage-tracker'
import { createGenerationContext } from '@/lib/utils/generation-context'

export interface SectionBatchRequest {
  projectId: string
  memoireId: string
  sectionIds: string[]
  itemId?: string
  itemTitle?: string
  responseLength?: 'short' | 'standard' | 'detailed'
}

export interface SectionBatchResult {
  results: Array<{
    sectionId: string
    content: string
    success: boolean
    error?: string
  }>
  planSummary?: string
}

interface ContentPlan {
  [sectionId: string]: {
    focusPoints: string[]
    avoidTopics: string[]
    suggestedLength: string
  }
}

export class SectionBatchAIService {
  /**
   * Génère plusieurs sections avec planification préalable
   */
  async generateBatchWithPlanning(
    userId: string,
    request: SectionBatchRequest
  ): Promise<SectionBatchResult> {
    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memo = await prisma.memoire.findUnique({
      where: { id: request.memoireId },
      include: {
        project: {
          include: {
            requirements: {
              take: 20,
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
              take: 10,
            },
          },
        },
        sections: {
          where: { id: { in: request.sectionIds } },
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

    const sections = memo.sections
    if (sections.length === 0) {
      throw new NotFoundError('MemoireSection', request.sectionIds.join(', '))
    }

    // Construire le contexte global
    const context = await this.buildContext(userId, memo.project, memo.templateDocumentId, memo.template)

    // ===== PHASE 1 : PLANIFICATION =====
    const plan = await this.generatePlan(userId, sections, context, request)

    // ===== PHASE 2 : GÉNÉRATION =====
    const results = await this.generateResponses(userId, sections, context, plan, request)

    return {
      results,
      planSummary: `Plan de répartition créé pour ${sections.length} questions`,
    }
  }

  /**
   * Phase 1 : Génère un plan de répartition du contenu
   */
  private async generatePlan(
    userId: string,
    sections: any[],
    context: any,
    request: SectionBatchRequest
  ): Promise<ContentPlan> {
    const questionsText = sections
      .map((s, idx) => `Q${idx + 1} [${s.id}]: ${s.question || s.title}`)
      .join('\n')

    const planPrompt = `Tu es un expert en rédaction de mémoires techniques BTP. Analyse ces ${sections.length} questions qui font partie du même chapitre/item "${request.itemTitle || 'non spécifié'}" et crée un plan de répartition du contenu.

## Questions à traiter :
${questionsText}

## Contexte disponible :
${context.companyProfile?.companyName ? `- Entreprise : ${context.companyProfile.companyName}` : ''}
${context.documents.length > 0 ? `- ${context.documents.length} documents sources disponibles` : ''}
${context.requirements.length > 0 ? `- ${context.requirements.length} exigences à respecter` : ''}

## Ta mission :
Pour CHAQUE question, détermine :
1. Les points clés à aborder (qui ne seront PAS répétés dans les autres questions)
2. Les sujets à éviter (car traités dans une autre question)
3. La longueur suggérée (courte si détails ailleurs, standard sinon)

Réponds UNIQUEMENT en JSON valide avec ce format :
{
  "sectionId1": {
    "focusPoints": ["point1", "point2"],
    "avoidTopics": ["sujet traité dans Q2", "sujet traité dans Q3"],
    "suggestedLength": "standard"
  },
  "sectionId2": {
    "focusPoints": ["point1", "point2"],
    "avoidTopics": ["sujet traité dans Q1"],
    "suggestedLength": "short"
  }
}

IMPORTANT :
- Évite les répétitions entre questions
- Si une question demande les effectifs et une autre l'organisation, ne pas répéter les noms dans les deux
- Répartis intelligemment le contenu pour que chaque réponse apporte une information NOUVELLE
- Utilise les IDs exacts des sections fournis`

    const planResponse = await aiClient.generateResponse(
      {
        system: 'Tu es un planificateur expert en rédaction technique. Tu réponds UNIQUEMENT en JSON valide.',
        user: planPrompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 1500,
      }
    )

    // Enregistrer la consommation
    if (planResponse.metadata?.inputTokens && planResponse.metadata?.outputTokens) {
      await UsageTracker.recordUsage(
        userId,
        planResponse.metadata.model || 'gpt-4o-mini',
        planResponse.metadata.inputTokens,
        planResponse.metadata.outputTokens,
        'section_batch_planning',
        { projectId: request.projectId }
      )
    }

    // Parser le JSON
    try {
      // Nettoyer la réponse (enlever les ```json si présents)
      let jsonStr = planResponse.content.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7)
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3)
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3)
      }
      jsonStr = jsonStr.trim()

      const plan = JSON.parse(jsonStr) as ContentPlan
      return plan
    } catch (parseError) {
      console.error('Error parsing plan JSON:', parseError, planResponse.content)
      // Retourner un plan vide si erreur de parsing
      return sections.reduce((acc, s) => {
        acc[s.id] = {
          focusPoints: [],
          avoidTopics: [],
          suggestedLength: 'standard',
        }
        return acc
      }, {} as ContentPlan)
    }
  }

  /**
   * Phase 2 : Génère les réponses en suivant le plan
   */
  private async generateResponses(
    userId: string,
    sections: any[],
    context: any,
    plan: ContentPlan,
    request: SectionBatchRequest
  ): Promise<SectionBatchResult['results']> {
    const results: SectionBatchResult['results'] = []

    // Générer chaque section séquentiellement
    for (const section of sections) {
      try {
        const sectionPlan = plan[section.id] || {
          focusPoints: [],
          avoidTopics: [],
          suggestedLength: 'standard',
        }

        const content = await this.generateSingleResponse(
          userId,
          section,
          context,
          sectionPlan,
          request
        )

        // Stocker le contexte de génération
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

          await prisma.memoireSection.update({
            where: { id: section.id },
            data: {
              generationContextJson: generationContext as any,
              generatedAt: new Date(),
            },
          })
        } catch (contextError) {
          console.warn('Could not store generation context for section', section.id, contextError)
        }

        results.push({
          sectionId: section.id,
          content,
          success: true,
        })
      } catch (err) {
        console.error(`Error generating section ${section.id}:`, err)
        results.push({
          sectionId: section.id,
          content: '',
          success: false,
          error: err instanceof Error ? err.message : 'Erreur de génération',
        })
      }
    }

    return results
  }

  /**
   * Génère une réponse individuelle en suivant le plan
   */
  private async generateSingleResponse(
    userId: string,
    section: any,
    context: any,
    sectionPlan: ContentPlan[string],
    request: SectionBatchRequest
  ): Promise<string> {
    const lengthInstructions = {
      short: '500-800 caractères',
      standard: '800-1500 caractères',
      detailed: '1500-2500 caractères',
    }

    const effectiveLength = sectionPlan.suggestedLength || request.responseLength || 'standard'

    let prompt = `## Question à traiter
Titre: ${section.title}
${section.question ? `Question: ${section.question}` : ''}

## Plan de réponse (établi pour éviter les répétitions avec les autres questions du même chapitre)
`

    if (sectionPlan.focusPoints.length > 0) {
      prompt += `\n### Points clés à aborder dans CETTE réponse :
${sectionPlan.focusPoints.map(p => `- ${p}`).join('\n')}
`
    }

    if (sectionPlan.avoidTopics.length > 0) {
      prompt += `\n### Sujets à NE PAS aborder (traités dans d'autres questions du chapitre) :
${sectionPlan.avoidTopics.map(t => `- ${t}`).join('\n')}
`
    }

    prompt += `\n### Longueur souhaitée : ${lengthInstructions[effectiveLength as keyof typeof lengthInstructions]}
`

    // Ajouter le profil entreprise
    if (context.companyProfile?.companyName) {
      prompt += `\n## Profil entreprise
Nom: ${context.companyProfile.companyName}
${context.companyProfile.description ? `Description: ${context.companyProfile.description}` : ''}
${context.companyProfile.activities ? `Activités: ${context.companyProfile.activities}` : ''}
${context.companyProfile.workforce ? `Effectifs: ${context.companyProfile.workforce}` : ''}
${context.companyProfile.equipment ? `Moyens matériels: ${context.companyProfile.equipment}` : ''}
${context.companyProfile.qualitySafety ? `Qualité/Sécurité: ${context.companyProfile.qualitySafety}` : ''}
${context.companyProfile.references ? `Références: ${context.companyProfile.references}` : ''}
${context.companyProfile.workMethodology ? `Méthodologie: ${context.companyProfile.workMethodology}` : ''}
`
    }

    // Ajouter les exigences pertinentes
    if (section.requirementLinks?.length > 0) {
      prompt += `\n## Exigences à respecter
${section.requirementLinks.slice(0, 5).map((link: any, idx: number) =>
  `${idx + 1}. ${link.requirement.title}${link.requirement.description ? ` - ${link.requirement.description.substring(0, 150)}` : ''}`
).join('\n')}
`
    }

    // Ajouter la méthodologie si disponible
    if (context.methodology) {
      prompt += `\n## Méthodologie rédactionnelle à respecter
${context.methodology}
`
    }

    prompt += `\n## RÈGLES
- Commence DIRECTEMENT par le contenu (pas de titre, pas de reformulation de la question)
- Ne répète PAS les informations des sujets à éviter
- Utilise des listes à puces (tirets -) pour les énumérations
- Chaque phrase doit apporter une information concrète
- Pas de conclusion générique

Génère maintenant la réponse.`

    const response = await aiClient.generateResponse(
      {
        system: `Tu es un rédacteur technique BTP expérimenté. Tu rédiges de manière professionnelle et structurée.

STYLE :
- Phrases complètes, ton professionnel
- Listes à puces (tirets -) pour les énumérations
- Vocabulaire technique BTP précis

À ÉVITER :
- Titres ou en-têtes
- Reformuler la question
- Répéter des informations déjà traitées dans d'autres questions
- Conclusions génériques

FORMAT : Texte brut avec tirets pour les listes.`,
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: effectiveLength === 'short' ? 1000 : effectiveLength === 'detailed' ? 3000 : 2000,
      }
    )

    // Enregistrer la consommation
    if (response.metadata?.inputTokens && response.metadata?.outputTokens) {
      await UsageTracker.recordUsage(
        userId,
        response.metadata.model || 'gpt-4o-mini',
        response.metadata.inputTokens,
        response.metadata.outputTokens,
        'section_batch_generation',
        { projectId: request.projectId }
      )
    }

    return response.content
  }

  /**
   * Construit le contexte (similaire à section-ai-service mais simplifié)
   */
  private async buildContext(userId: string, project: any, templateDocumentId: string, templateDoc: any) {
    // Récupérer le profil entreprise
    let companyProfile: any = {}
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

    // Récupérer la méthodologie
    let methodology = ''
    try {
      const { companyProfileService } = await import('./company-profile-service')
      methodology = await companyProfileService.getMethodologyForAI(userId)
    } catch (error) {
      console.warn('Could not load methodology:', error)
    }

    // Récupérer les documents sources
    const documentExtracts = project.documents
      .filter((doc: any) =>
        doc.documentType &&
        ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'AUTRE'].includes(doc.documentType)
      )
      .map((doc: any) => {
        let extract = ''
        if (doc.analyses.length > 0) {
          const analysis = doc.analyses[0]
          const result = analysis.result as any
          extract = result.extractedContent?.text || result.text || ''
        }
        return {
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          extract: extract.substring(0, 1500),
        }
      })
      .filter((doc: any) => doc.extract.length > 0)
      .slice(0, 5)

    return {
      companyProfile,
      methodology,
      documents: documentExtracts,
      requirements: project.requirements || [],
    }
  }
}

export const sectionBatchAIService = new SectionBatchAIService()
