/**
 * Gestionnaire de priorité des jobs avec interruption/reprise
 *
 * Priorités :
 * - LOW: Extraction des exigences (silencieux, interruptible)
 * - HIGH: Extraction questions, génération réponses (prioritaires)
 *
 * Logique :
 * - Un job HIGH interrompt les jobs LOW en cours
 * - À la fin d'un job HIGH, les jobs LOW interrompus reprennent
 * - Notification quand un job LOW se termine
 */

import { EventEmitter } from 'events'

export type JobPriority = 'LOW' | 'HIGH'
export type JobType = 'REQUIREMENT_EXTRACTION' | 'QUESTION_EXTRACTION' | 'ANSWER_GENERATION'
export type JobStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'CANCELLED'

interface Job {
  id: string
  projectId: string
  type: JobType
  priority: JobPriority
  status: JobStatus
  documentIds?: string[] // Pour l'extraction des exigences
  currentDocumentIndex?: number // Pour la reprise
  createdAt: Date
  startedAt?: Date
  pausedAt?: Date
  completedAt?: Date
  error?: string
}

interface JobCompletionEvent {
  jobId: string
  projectId: string
  type: JobType
  success: boolean
  message?: string
}

class JobPriorityManager extends EventEmitter {
  private jobs: Map<string, Job> = new Map()
  private projectLocks: Map<string, string> = new Map() // projectId -> jobId actif
  private pausedJobs: Map<string, Job> = new Map() // Jobs en pause par projet

  /**
   * Génère un ID unique pour un job
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Vérifie si un projet a un job HIGH en cours
   */
  hasHighPriorityJob(projectId: string): boolean {
    const activeJobId = this.projectLocks.get(projectId)
    if (!activeJobId) return false

    const job = this.jobs.get(activeJobId)
    return job?.priority === 'HIGH' && job?.status === 'RUNNING'
  }

  /**
   * Vérifie si l'extraction des exigences doit être interrompue
   */
  shouldPauseRequirementExtraction(projectId: string): boolean {
    return this.hasHighPriorityJob(projectId)
  }

  /**
   * Enregistre un nouveau job
   */
  registerJob(projectId: string, type: JobType, documentIds?: string[]): string {
    const priority: JobPriority = type === 'REQUIREMENT_EXTRACTION' ? 'LOW' : 'HIGH'
    const jobId = this.generateJobId()

    const job: Job = {
      id: jobId,
      projectId,
      type,
      priority,
      status: 'PENDING',
      documentIds,
      currentDocumentIndex: 0,
      createdAt: new Date(),
    }

    this.jobs.set(jobId, job)
    console.log(`[JobManager] Registered job ${jobId} (${type}) for project ${projectId}`)

    return jobId
  }

  /**
   * Démarre un job - gère les interruptions si nécessaire
   * Retourne true si le job peut démarrer, false s'il doit attendre
   */
  startJob(jobId: string): { canStart: boolean; pausedJobId?: string } {
    const job = this.jobs.get(jobId)
    if (!job) {
      console.error(`[JobManager] Job ${jobId} not found`)
      return { canStart: false }
    }

    const activeJobId = this.projectLocks.get(job.projectId)
    const activeJob = activeJobId ? this.jobs.get(activeJobId) : null

    // Si un job est déjà actif
    if (activeJob && activeJob.status === 'RUNNING' && activeJobId) {
      // Job HIGH peut interrompre un job LOW
      if (job.priority === 'HIGH' && activeJob.priority === 'LOW') {
        console.log(`[JobManager] Pausing LOW priority job ${activeJobId} for HIGH priority job ${jobId}`)
        this.pauseJob(activeJobId)

        // Mettre le nouveau job en actif
        job.status = 'RUNNING'
        job.startedAt = new Date()
        this.projectLocks.set(job.projectId, jobId)

        return { canStart: true, pausedJobId: activeJobId }
      }

      // Sinon, le nouveau job doit attendre
      console.log(`[JobManager] Job ${jobId} waiting for ${activeJobId} to complete`)
      return { canStart: false }
    }

    // Pas de job actif, on peut démarrer
    job.status = 'RUNNING'
    job.startedAt = new Date()
    this.projectLocks.set(job.projectId, jobId)

    console.log(`[JobManager] Started job ${jobId}`)
    return { canStart: true }
  }

  /**
   * Met en pause un job (pour permettre à un job prioritaire de s'exécuter)
   */
  pauseJob(jobId: string, currentDocumentIndex?: number): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = 'PAUSED'
    job.pausedAt = new Date()
    if (currentDocumentIndex !== undefined) {
      job.currentDocumentIndex = currentDocumentIndex
    }

    // Sauvegarder pour reprise
    this.pausedJobs.set(job.projectId, job)

    console.log(`[JobManager] Paused job ${jobId} at document index ${job.currentDocumentIndex}`)
  }

  /**
   * Marque un job comme terminé et vérifie s'il y a des jobs en pause à reprendre
   */
  completeJob(jobId: string, success: boolean = true, error?: string): Job | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    job.status = success ? 'COMPLETED' : 'ERROR'
    job.completedAt = new Date()
    if (error) job.error = error

    // Libérer le verrou du projet
    if (this.projectLocks.get(job.projectId) === jobId) {
      this.projectLocks.delete(job.projectId)
    }

    console.log(`[JobManager] Completed job ${jobId} (success: ${success})`)

    // Émettre l'événement de complétion
    const event: JobCompletionEvent = {
      jobId,
      projectId: job.projectId,
      type: job.type,
      success,
      message: success
        ? this.getCompletionMessage(job.type)
        : error,
    }
    this.emit('jobCompleted', event)

    // Vérifier s'il y a un job LOW en pause à reprendre
    const pausedJob = this.pausedJobs.get(job.projectId)
    if (pausedJob && job.priority === 'HIGH') {
      console.log(`[JobManager] Resuming paused job ${pausedJob.id}`)
      this.pausedJobs.delete(job.projectId)

      // Remettre le job en état de reprise
      pausedJob.status = 'PENDING'
      this.emit('jobResumed', pausedJob)

      return pausedJob
    }

    return null
  }

  /**
   * Annule un job
   */
  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = 'CANCELLED'
    job.completedAt = new Date()

    if (this.projectLocks.get(job.projectId) === jobId) {
      this.projectLocks.delete(job.projectId)
    }

    console.log(`[JobManager] Cancelled job ${jobId}`)
  }

  /**
   * Récupère l'état actuel d'un job
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Récupère le job en pause pour un projet
   */
  getPausedJob(projectId: string): Job | undefined {
    return this.pausedJobs.get(projectId)
  }

  /**
   * Met à jour l'index du document courant (pour la reprise)
   */
  updateJobProgress(jobId: string, currentDocumentIndex: number): void {
    const job = this.jobs.get(jobId)
    if (job) {
      job.currentDocumentIndex = currentDocumentIndex
    }
  }

  /**
   * Message de complétion selon le type de job
   */
  private getCompletionMessage(type: JobType): string {
    switch (type) {
      case 'REQUIREMENT_EXTRACTION':
        return 'Extraction des exigences terminée'
      case 'QUESTION_EXTRACTION':
        return 'Extraction des questions terminée'
      case 'ANSWER_GENERATION':
        return 'Génération des réponses terminée'
      default:
        return 'Job terminé'
    }
  }

  /**
   * Nettoie les jobs anciens (> 1 heure)
   */
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    for (const [jobId, job] of this.jobs) {
      if (job.completedAt && job.completedAt < oneHourAgo) {
        this.jobs.delete(jobId)
      }
    }
  }
}

// Singleton
export const jobPriorityManager = new JobPriorityManager()
