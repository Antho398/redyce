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
          status: 'PENDING',
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
    const prompt = `Tu es un assistant expert en analyse d'appels d'offres pour le bâtiment.

Analyse le document suivant et extrais toutes les exigences techniques, administratives et réglementaires.

Document:
${documentText.substring(0, 15000)} // Limiter à 15k caractères

Pour chaque exigence, identifie:
- code: code de référence si présent (ex: "REQ-001", "EX-1.2")
- title: titre court de l'exigence
- description: description détaillée
- category: catégorie (technique, administratif, réglementaire, qualité, etc.)
- priority: priorité (high, normal, low)

Format attendu:
{
  "requirements": [
    {
      "code": "REQ-001",
      "title": "Exigence technique sur les matériaux",
      "description": "Description détaillée de l'exigence...",
      "category": "technique",
      "priority": "high"
    }
  ]
}

Extrais toutes les exigences de manière exhaustive.`

    const response = await aiClient.generateResponse(
      {
        system:
          'Tu es un expert en analyse d\'appels d\'offres. Tu extrais avec précision toutes les exigences techniques, administratives et réglementaires.',
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 3000,
      }
    )

    // Tracker l'usage
    await usageTracker.trackUsage({
      userId,
      model: 'gpt-4o-mini',
      inputTokens: response.metadata?.inputTokens || 0,
      outputTokens: response.metadata?.outputTokens || 0,
      operation: 'requirement_extraction',
      projectId,
      documentId,
    })

    // Parser la réponse JSON
    try {
      const parsed = JSON.parse(response.content)
      return parsed.requirements || []
    } catch (error) {
      // Si le parsing échoue, essayer d'extraire le JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.requirements || []
      }
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

    // Récupérer les sections
    const sections = await prisma.memorySection.findMany({
      where: { projectId },
      include: {
        requirementLinks: true,
      },
    })

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

