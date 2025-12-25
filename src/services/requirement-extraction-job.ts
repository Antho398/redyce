/**
 * Service de job pour l'extraction automatique des exigences
 *
 * Ce service gère l'extraction idempotente des exigences depuis les documents AO.
 * Il est déclenché automatiquement après l'upload d'un document AO.
 *
 * Pipeline : WAITING -> PROCESSING -> DONE | ERROR | PAUSED
 *
 * Fonctionnalités :
 * - Extraction automatique en arrière-plan
 * - Interruptible par des jobs haute priorité (questions, réponses)
 * - Reprise automatique après interruption
 * - Notification à la fin
 */

import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { fileStorage } from '@/lib/documents/storage'
import { UsageTracker } from '@/services/usage-tracker'
import { jobPriorityManager } from '@/services/job-priority-manager'
import crypto from 'crypto'

// Types de documents AO (pour référence, mais l'extraction se fait sur tous les documents)
export const AO_DOCUMENT_TYPES = ['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'AUTRE', 'MODELE_MEMOIRE'] as const

interface ExtractedRequirement {
  code?: string
  title: string
  description: string
  category?: string
  priority?: string
  sourcePage?: number
  sourceQuote?: string
}

interface ExtractionResult {
  success: boolean
  documentId: string
  requirementsCreated: number
  requirementsSkipped: number // Doublons ignorés
  error?: string
  paused?: boolean // Job interrompu par un job haute priorité
}

interface ProjectExtractionResult {
  success: boolean
  projectId: string
  jobId: string
  totalDocuments: number
  processedDocuments: number
  totalRequirements: number
  paused?: boolean
}

/**
 * Génère un hash stable pour une exigence (dédoublonnage)
 */
function generateRequirementHash(projectId: string, documentId: string, title: string): string {
  // Normaliser le titre (lowercase, trim, remove extra spaces)
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, ' ')
  const content = `${projectId}|${documentId}|${normalizedTitle}`
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32)
}

/**
 * Classe principale du job d'extraction
 */
export class RequirementExtractionJob {
  /**
   * Lance l'extraction des exigences pour un document spécifique
   */
  async extractForDocument(documentId: string, userId: string): Promise<ExtractionResult> {
    console.log(`[RequirementExtractionJob] Starting extraction for document ${documentId}`)

    try {
      // 1. Récupérer le document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          project: true,
          analyses: {
            where: { status: 'completed', analysisType: 'extraction' },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!document) {
        throw new Error(`Document ${documentId} not found`)
      }

      // Vérifier si on doit s'interrompre (job haute priorité en cours)
      if (jobPriorityManager.shouldPauseRequirementExtraction(document.projectId)) {
        console.log(`[RequirementExtractionJob] Pausing extraction for document ${documentId} - high priority job running`)
        await prisma.document.update({
          where: { id: documentId },
          data: { requirementStatus: 'WAITING' },
        })
        return {
          success: true,
          documentId,
          requirementsCreated: 0,
          requirementsSkipped: 0,
          paused: true,
        }
      }

      // 2. Mettre à jour le statut -> PROCESSING
      await prisma.document.update({
        where: { id: documentId },
        data: {
          requirementStatus: 'PROCESSING',
        },
      })

      // 3. Extraire le texte du document
      let documentText = ''

      // Essayer d'abord depuis l'analyse existante
      if (document.analyses[0]?.result) {
        const analysis = document.analyses[0]
        const result = analysis.result as any
        documentText = result.extractedContent?.text || result.text || ''
      }

      // Si pas de texte, parser le document
      if (!documentText) {
        console.log(`[RequirementExtractionJob] Parsing document ${documentId}`)
        const fileBuffer = await fileStorage.readFile(document.filePath)
        const processor = new DocumentProcessor()
        const parsed = await processor.processDocument(
          fileBuffer,
          document.mimeType,
          document.documentType || 'AUTRE'
        )
        documentText = parsed.extractedContent?.text || ''

        // Sauvegarder l'analyse pour éviter de re-parser
        await prisma.documentAnalysis.create({
          data: {
            documentId,
            analysisType: 'extraction',
            status: 'completed',
            result: { text: documentText, extractedContent: { text: documentText } },
          },
        })
      }

      if (!documentText || documentText.length < 50) {
        throw new Error('Document text is too short or empty')
      }

      // Re-vérifier avant l'appel IA (qui est long)
      if (jobPriorityManager.shouldPauseRequirementExtraction(document.projectId)) {
        console.log(`[RequirementExtractionJob] Pausing before AI call for document ${documentId}`)
        await prisma.document.update({
          where: { id: documentId },
          data: { requirementStatus: 'WAITING' },
        })
        return {
          success: true,
          documentId,
          requirementsCreated: 0,
          requirementsSkipped: 0,
          paused: true,
        }
      }

      // 4. Extraire les exigences avec l'IA
      const requirements = await this.extractWithAI(documentText, document.projectId, documentId, userId)

      // 5. Insérer les exigences en DB avec dédoublonnage
      let created = 0
      let skipped = 0

      for (const req of requirements) {
        const contentHash = generateRequirementHash(document.projectId, documentId, req.title)

        try {
          // Upsert avec contrainte unique
          await prisma.requirement.upsert({
            where: {
              projectId_documentId_contentHash: {
                projectId: document.projectId,
                documentId,
                contentHash,
              },
            },
            update: {
              // Ne pas mettre à jour si existe déjà (idempotence)
            },
            create: {
              projectId: document.projectId,
              documentId,
              code: req.code || null,
              title: req.title,
              description: req.description,
              category: req.category || null,
              priority: this.normalizePriority(req.priority),
              status: 'A_TRAITER',
              sourcePage: req.sourcePage || null,
              sourceQuote: req.sourceQuote || null,
              contentHash,
            },
          })
          created++
        } catch (error: any) {
          // Si erreur de contrainte unique, c'est un doublon
          if (error.code === 'P2002') {
            skipped++
          } else {
            console.error(`[RequirementExtractionJob] Error inserting requirement:`, error)
          }
        }
      }

      // 6. Mettre à jour le statut -> DONE
      await prisma.document.update({
        where: { id: documentId },
        data: {
          requirementStatus: 'DONE',
          requirementProcessedAt: new Date(),
          requirementErrorMessage: null,
        },
      })

      console.log(
        `[RequirementExtractionJob] Completed for document ${documentId}: ${created} created, ${skipped} skipped`
      )

      return {
        success: true,
        documentId,
        requirementsCreated: created,
        requirementsSkipped: skipped,
      }
    } catch (error) {
      console.error(`[RequirementExtractionJob] Error for document ${documentId}:`, error)

      // Mettre à jour le statut -> ERROR
      await prisma.document.update({
        where: { id: documentId },
        data: {
          requirementStatus: 'ERROR',
          requirementErrorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      return {
        success: false,
        documentId,
        requirementsCreated: 0,
        requirementsSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Lance l'extraction pour tous les documents d'un projet en attente
   * Version interruptible avec gestion des priorités
   */
  async extractForProject(
    projectId: string,
    userId: string,
    startFromIndex: number = 0
  ): Promise<ProjectExtractionResult> {
    // Enregistrer le job
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        OR: [{ requirementStatus: 'WAITING' }, { requirementStatus: null }],
      },
      orderBy: { createdAt: 'asc' },
    })

    const documentIds = documents.map((d) => d.id)
    const jobId = jobPriorityManager.registerJob(projectId, 'REQUIREMENT_EXTRACTION', documentIds)

    // Essayer de démarrer le job
    const { canStart } = jobPriorityManager.startJob(jobId)

    if (!canStart) {
      console.log(`[RequirementExtractionJob] Cannot start job ${jobId} - another job is running`)
      return {
        success: false,
        projectId,
        jobId,
        totalDocuments: documents.length,
        processedDocuments: 0,
        totalRequirements: 0,
        paused: true,
      }
    }

    console.log(
      `[RequirementExtractionJob] Starting job ${jobId} for project ${projectId} (${documents.length} documents, starting at ${startFromIndex})`
    )

    let processedCount = 0
    let totalRequirements = 0

    try {
      for (let i = startFromIndex; i < documents.length; i++) {
        const doc = documents[i]

        // Vérifier si on doit s'interrompre
        if (jobPriorityManager.shouldPauseRequirementExtraction(projectId)) {
          console.log(`[RequirementExtractionJob] Job ${jobId} paused at document ${i}/${documents.length}`)
          jobPriorityManager.pauseJob(jobId, i)

          return {
            success: true,
            projectId,
            jobId,
            totalDocuments: documents.length,
            processedDocuments: processedCount,
            totalRequirements,
            paused: true,
          }
        }

        // Mettre à jour la progression
        jobPriorityManager.updateJobProgress(jobId, i)

        const result = await this.extractForDocument(doc.id, userId)

        if (result.paused) {
          // Le document a été mis en pause, on arrête
          jobPriorityManager.pauseJob(jobId, i)
          return {
            success: true,
            projectId,
            jobId,
            totalDocuments: documents.length,
            processedDocuments: processedCount,
            totalRequirements,
            paused: true,
          }
        }

        if (result.success) {
          processedCount++
          totalRequirements += result.requirementsCreated
        }
      }

      // Job terminé avec succès
      const resumedJob = jobPriorityManager.completeJob(jobId, true)

      // Si un job était en pause, le reprendre
      if (resumedJob) {
        console.log(`[RequirementExtractionJob] Auto-resuming job ${resumedJob.id}`)
        setImmediate(() => {
          this.extractForProject(projectId, userId, resumedJob.currentDocumentIndex || 0)
        })
      }

      return {
        success: true,
        projectId,
        jobId,
        totalDocuments: documents.length,
        processedDocuments: processedCount,
        totalRequirements,
      }
    } catch (error) {
      console.error(`[RequirementExtractionJob] Job ${jobId} failed:`, error)
      jobPriorityManager.completeJob(jobId, false, error instanceof Error ? error.message : 'Unknown error')

      return {
        success: false,
        projectId,
        jobId,
        totalDocuments: documents.length,
        processedDocuments: processedCount,
        totalRequirements,
      }
    }
  }

  /**
   * Lance l'extraction en arrière-plan pour un projet
   * Méthode principale à appeler depuis l'upload
   */
  async startBackgroundExtraction(projectId: string, userId: string): Promise<string> {
    const jobId = jobPriorityManager.registerJob(projectId, 'REQUIREMENT_EXTRACTION')

    // Lancer en arrière-plan
    setImmediate(async () => {
      await this.extractForProject(projectId, userId)
    })

    return jobId
  }

  /**
   * Enqueue un document pour extraction (met le statut à WAITING)
   */
  async enqueueDocument(documentId: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error(`Document ${documentId} not found`)
    }

    // Ne pas re-enqueue si déjà traité avec succès
    if (document.requirementStatus === 'DONE') {
      console.log(`[RequirementExtractionJob] Document ${documentId} already processed, not re-enqueueing`)
      return
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        requirementStatus: 'WAITING',
      },
    })

    console.log(`[RequirementExtractionJob] Document ${documentId} enqueued for extraction`)
  }

  /**
   * Extraction des exigences avec l'IA
   */
  private async extractWithAI(
    documentText: string,
    projectId: string,
    documentId: string,
    userId: string
  ): Promise<ExtractedRequirement[]> {
    // Chunking : limiter à 30000 caractères
    let processedText = documentText
    const MAX_LENGTH = 30000

    if (documentText.length > MAX_LENGTH) {
      const start = documentText.substring(0, 15000)
      const end = documentText.substring(documentText.length - 15000)
      processedText = `${start}\n\n[... contenu omis ...]\n\n${end}`
    }

    const prompt = `Tu es un assistant expert en analyse d'appels d'offres pour le bâtiment et les travaux publics.

Analyse le document suivant et extrais TOUTES les exigences actionnables : livrables, contraintes, critères, délais, normes, pénalités, formats, pièces demandées, etc.

Document:
${processedText}

⚠️ IMPORTANT : Ne JAMAIS inventer d'exigences. Si tu as un doute, marque priority: "LOW".

Pour chaque exigence extraite, fournis:
- code: code de référence si présent dans le texte (ex: "REQ-001", "EX-1.2", "Art. 3.2")
- title: titre court et clair de l'exigence (phrase actionnable, max 100 caractères)
- description: description détaillée de l'exigence
- category: catégorie (technique, administratif, réglementaire, qualité, délai, format)
- priority: priorité selon l'impact (LOW, MED, HIGH)
  - HIGH: Délais critiques, pénalités, normes obligatoires, critères d'exclusion
  - MED: Contraintes importantes, formats spécifiques
  - LOW: Informations complémentaires, recommandations
- sourceQuote: citation exacte du document (2-3 phrases maximum)
- sourcePage: numéro de page si mentionné, sinon null

Format JSON strict:
{
  "requirements": [
    {
      "code": "REQ-001",
      "title": "Livraison des matériaux conforme aux normes NF",
      "description": "Tous les matériaux doivent être conformes aux normes NF en vigueur.",
      "category": "technique",
      "priority": "HIGH",
      "sourceQuote": "Article 3.2 : Les matériaux doivent être conformes aux normes NF.",
      "sourcePage": 12
    }
  ]
}

Extrais toutes les exigences de manière exhaustive et précise.`

    const response = await aiClient.generateResponse(
      {
        system:
          "Tu es un expert en analyse d'appels d'offres BTP. Tu extrais avec précision toutes les exigences actionnables. Tu ne crées JAMAIS d'exigences qui ne sont pas présentes dans le document source.",
        user: prompt,
      },
      {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 4000,
      }
    )

    // Tracker l'usage OpenAI
    if (response.metadata?.inputTokens && response.metadata?.outputTokens) {
      try {
        // Récupérer l'email de l'utilisateur
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        })

        await UsageTracker.recordUsage(
          userId,
          response.metadata.model || 'gpt-4o-mini',
          response.metadata.inputTokens,
          response.metadata.outputTokens,
          'requirement_extraction',
          {
            userEmail: user?.email,
            projectId,
            documentId,
          }
        )
      } catch (error) {
        console.error('[RequirementExtractionJob] Failed to track usage:', error)
        // Ne pas bloquer si le tracking échoue
      }
    }

    // Parser la réponse JSON
    try {
      let parsed
      try {
        parsed = JSON.parse(response.content)
      } catch {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      }

      return parsed.requirements || []
    } catch (error) {
      console.error('[RequirementExtractionJob] Failed to parse AI response:', error)
      throw new Error('Failed to parse requirements from AI response')
    }
  }

  /**
   * Normalise la priorité
   */
  private normalizePriority(priority?: string): string {
    if (!priority) return 'LOW'
    const upper = priority.toUpperCase()
    if (upper === 'HIGH') return 'HIGH'
    if (upper === 'MED' || upper === 'MEDIUM') return 'MED'
    return 'LOW'
  }
}

export const requirementExtractionJob = new RequirementExtractionJob()
