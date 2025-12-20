/**
 * Service métier pour la gestion des exigences et leur mapping vers les sections
 */

import { prisma } from '@/lib/prisma/client'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { aiClient } from '@/lib/ai/client'
import { usageTracker } from '@/services/usage-tracker'
import { documentService } from './document-service'

export class RequirementService {
  /**
   * Extrait les exigences d'un document AO (Appel d'Offres)
   */
  async extractRequirements(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
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

    if (!document) {
      throw new NotFoundError('Document', documentId)
    }

    if (document.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this document')
    }

    if (!document.analyses[0]?.result) {
      throw new Error('Le document doit être analysé avant d\'extraire les exigences')
    }

    // Extraire le texte du document
    const analysis = document.analyses[0]
    const result = analysis.result as any
    const documentText = result.extractedContent?.text || result.text || ''

    // Utiliser l'IA pour extraire les exigences
    const requirements = await this.extractRequirementsWithAI(
      documentText,
      document.projectId,
      documentId,
      userId
    )

    // Créer les exigences en base
    const createdRequirements = []
    for (const req of requirements) {
      const created = await prisma.requirement.create({
        data: {
          projectId: document.projectId,
          documentId,
          code: req.code || null,
          title: req.title,
          description: req.description,
          category: req.category || null,
          priority: req.priority || null,
          status: req.status || 'A_TRAITER',
          sourcePage: req.sourcePage || null,
          sourceQuote: req.sourceQuote || null,
        },
      })
      createdRequirements.push(created)
    }

    return createdRequirements
  }

  /**
   * Extrait les exigences avec l'IA
   */
  private async extractRequirementsWithAI(
    documentText: string,
    projectId: string,
    documentId: string,
    userId: string
  ) {
    // Chunking simple : limiter à 30000 caractères pour éviter les limites de tokens
    // Prendre les premiers caractères + quelques chunks au milieu si disponible
    let processedText = documentText
    const MAX_LENGTH = 30000
    
    if (documentText.length > MAX_LENGTH) {
      // Prendre le début (15000 chars) + la fin (15000 chars)
      const start = documentText.substring(0, 15000)
      const end = documentText.substring(documentText.length - 15000)
      processedText = `${start}\n\n[... contenu omis ...]\n\n${end}`
    } else {
      processedText = documentText.substring(0, MAX_LENGTH)
    }

    const prompt = `Tu es un assistant expert en analyse d'appels d'offres pour le bâtiment et les travaux publics.

Analyse le document suivant et extrais TOUTES les exigences actionnables : livrables, contraintes, critères, délais, normes, pénalités, formats, pièces demandées, etc.

Document:
${processedText}

⚠️ IMPORTANT : Ne JAMAIS inventer d'exigences. Si tu as un doute, marque priority: "LOW" et status: "A_TRAITER".

Pour chaque exigence extraite, fournis:
- code: code de référence si présent dans le texte (ex: "REQ-001", "EX-1.2", "Art. 3.2")
- title: titre court et clair de l'exigence (phrase actionnable)
- description: description détaillée de l'exigence
- category: catégorie (technique, administratif, réglementaire, qualité, délai, format, etc.)
- priority: priorité selon l'impact (LOW, MED, HIGH)
  - HIGH: Délais critiques, pénalités, normes obligatoires, critères d'exclusion
  - MED: Contraintes importantes, formats spécifiques
  - LOW: Informations complémentaires, recommandations
- sourceQuote: citation exacte du document (2-3 phrases maximum) permettant de retrouver l'exigence
- sourcePage: numéro de page si mentionné dans le texte, sinon null

Format JSON strict attendu:
{
  "requirements": [
    {
      "code": "REQ-001",
      "title": "Livraison des matériaux conforme aux normes NF",
      "description": "Tous les matériaux doivent être conformes aux normes NF en vigueur au moment de la livraison.",
      "category": "technique",
      "priority": "HIGH",
      "sourceQuote": "Article 3.2 : Les matériaux doivent être conformes aux normes NF en vigueur.",
      "sourcePage": 12
    }
  ]
}

Extrais toutes les exigences de manière exhaustive et précise.`

    const response = await aiClient.generateResponse(
      {
        system:
          'Tu es un expert en analyse d\'appels d\'offres BTP. Tu extrais avec précision toutes les exigences actionnables (livrables, contraintes, critères, délais, normes, pénalités, formats). Tu ne crées JAMAIS d\'exigences qui ne sont pas présentes dans le document source.',
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.2, // Température basse pour plus de précision
        maxTokens: 4000,
      }
    )

    // Tracker l'usage
    if (usageTracker) {
      await usageTracker.trackUsage({
        userId,
        model: 'gpt-4o-mini',
        inputTokens: response.metadata?.inputTokens || 0,
        outputTokens: response.metadata?.outputTokens || 0,
        operation: 'requirement_extraction',
        projectId,
        documentId,
      })
    }

    // Parser la réponse JSON
    try {
      // Essayer de parser directement
      let parsed
      try {
        parsed = JSON.parse(response.content)
      } catch {
        // Si échec, extraire le JSON avec regex
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      }

      const requirements = parsed.requirements || []
      
      // Normaliser les valeurs
      return requirements.map((req: any) => ({
        ...req,
        priority: req.priority?.toUpperCase() === 'HIGH' ? 'HIGH' : req.priority?.toUpperCase() === 'MED' ? 'MED' : 'LOW',
        status: 'A_TRAITER', // Par défaut A_TRAITER
      }))
    } catch (error) {
      console.error('Failed to parse requirements:', error)
      console.error('AI response:', response.content.substring(0, 500))
      throw new Error('Failed to parse requirements from AI response')
    }
  }

  /**
   * Récupère toutes les exigences d'un projet
   */
  async getProjectRequirements(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      include: {
        document: true,
        sectionLinks: {
          include: {
            section: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return requirements
  }

  /**
   * Mappe les exigences vers les sections mémoire
   */
  async mapRequirementsToSections(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Récupérer les exigences
    const requirements = await prisma.requirement.findMany({
      where: { projectId },
    })

    // Récupérer les sections (via les mémoires du projet)
    const memos = await prisma.memoire.findMany({
      where: { projectId },
      include: {
        sections: {
          include: {
            requirementLinks: true,
          },
        },
      },
    })
    
    // Extraire toutes les sections de tous les mémoires
    const sections = memos.flatMap(memo => memo.sections)

    if (requirements.length === 0) {
      throw new Error('Aucune exigence trouvée. Extrayez d\'abord les exigences depuis vos documents.')
    }

    if (sections.length === 0) {
      throw new Error('Aucune section trouvée. Analysez d\'abord le template mémoire.')
    }

    // Utiliser l'IA pour mapper les exigences aux sections
    const mappings = await this.mapRequirementsWithAI(
      requirements,
      sections,
      projectId,
      userId
    )

    // Supprimer les anciens liens
    await prisma.requirementLink.deleteMany({
      where: {
        section: {
          projectId,
        },
      },
    })

    // Créer les nouveaux liens
    const createdLinks = []
    for (const mapping of mappings) {
      if (mapping.relevance && mapping.relevance > 0.3) {
        // Seulement créer des liens avec une pertinence > 0.3
        const link = await prisma.requirementLink.create({
          data: {
            sectionId: mapping.sectionId,
            requirementId: mapping.requirementId,
            relevance: mapping.relevance,
          },
        })
        createdLinks.push(link)
      }
    }

    return createdLinks
  }

  /**
   * Mappe les exigences aux sections avec l'IA
   */
  private async mapRequirementsWithAI(
    requirements: any[],
    sections: any[],
    projectId: string,
    userId: string
  ) {
    const prompt = `Tu es un assistant expert en analyse de correspondance entre exigences et sections de mémoire technique.

Exigences du projet:
${JSON.stringify(
      requirements.map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        description: r.description,
        category: r.category,
      })),
      null,
      2
    )}

Sections du mémoire:
${JSON.stringify(
      sections.map((s) => ({
        id: s.id,
        title: s.title,
        question: s.question,
        description: s.description,
      })),
      null,
      2
    )}

Pour chaque paire (exigence, section), détermine si l'exigence est pertinente pour répondre à cette section.

Format attendu:
{
  "mappings": [
    {
      "sectionId": "section_id",
      "requirementId": "requirement_id",
      "relevance": 0.85
    }
  ]
}

La pertinence (relevance) est un score entre 0 et 1:
- 1.0: L'exigence est directement liée à la section
- 0.5-0.9: L'exigence est pertinente mais indirectement
- 0.0-0.4: L'exigence n'est pas pertinente pour cette section

Retourne uniquement les mappings avec une pertinence > 0.3.`

    const response = await aiClient.generateResponse(
      {
        system:
          'Tu es un expert en analyse de correspondance. Tu identifies avec précision les liens entre exigences et sections de mémoire technique.',
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 3000,
      }
    )

    // Tracker l'usage
    await usageTracker.trackUsage({
      userId,
      model: 'gpt-4o-mini',
      inputTokens: response.metadata?.inputTokens || 0,
      outputTokens: response.metadata?.outputTokens || 0,
      operation: 'requirement_mapping',
      projectId,
    })

    // Parser la réponse JSON
    try {
      const parsed = JSON.parse(response.content)
      return parsed.mappings || []
    } catch (error) {
      // Si le parsing échoue, essayer d'extraire le JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.mappings || []
      }
      throw new Error('Failed to parse mappings from AI response')
    }
  }

  /**
   * Supprime une exigence
   */
  async deleteRequirement(requirementId: string, userId: string) {
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    })

    if (!requirement) {
      throw new NotFoundError('Requirement', requirementId)
    }

    if (requirement.project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this requirement')
    }

    await prisma.requirement.delete({
      where: { id: requirementId },
    })
  }
}

export const requirementService = new RequirementService()

