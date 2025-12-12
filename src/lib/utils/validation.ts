/**
 * Schemas de validation Zod réutilisables
 */

import { z } from 'zod'
import { DOCUMENT_TYPES } from '@/config/constants'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis'),
  description: z.string().optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

export const uploadDocumentSchema = z.object({
  projectId: z.string().cuid(),
  documentType: z.nativeEnum(DOCUMENT_TYPES).optional(),
})

export const createMemorySchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1, 'Le titre est requis'),
})

export const updateMemorySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
})

export const chatMessageSchema = z.object({
  projectId: z.string().cuid().optional(),
  content: z.string().min(1, 'Le message ne peut pas être vide'),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
})

// Schémas DPGF
export const extractDPGFSchema = z.object({
  documentId: z.string().cuid(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const updateDPGFSchema = z.object({
  title: z.string().min(1).optional(),
  reference: z.string().optional(),
  status: z.enum(['extracted', 'validated', 'archived']).optional(),
})

// Schémas CCTP
export const generateCCTPFromDPGFSchema = z.object({
  dpgfId: z.string().cuid(),
  userRequirements: z.string().optional(),
  additionalContext: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const generateCCTPFromDocumentsSchema = z.object({
  projectId: z.string().cuid(),
  userRequirements: z.string().optional(),
  additionalContext: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const updateCCTPSchema = z.object({
  title: z.string().min(1).optional(),
  reference: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'generated', 'finalized', 'archived']).optional(),
})

// Schémas améliorés pour documents
export const documentUploadSchema = z.object({
  projectId: z.string().cuid(),
  documentType: z.nativeEnum(DOCUMENT_TYPES).optional(),
  name: z.string().min(1).optional(), // Optionnel, utilise le nom du fichier par défaut
})

// Schémas pour analyse de documents
export const analyzeDocumentSchema = z.object({
  documentId: z.string().cuid(),
  analysisType: z.enum(['extraction', 'summary', 'qa', 'full']).default('full'),
  questions: z.array(z.string()).optional(),
  maxLength: z.number().min(100).max(2000).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>
export type CreateMemoryInput = z.infer<typeof createMemorySchema>
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type ExtractDPGFInput = z.infer<typeof extractDPGFSchema>
export type UpdateDPGFInput = z.infer<typeof updateDPGFSchema>
export type GenerateCCTPFromDPGFInput = z.infer<typeof generateCCTPFromDPGFSchema>
export type GenerateCCTPFromDocumentsInput = z.infer<typeof generateCCTPFromDocumentsSchema>
export type UpdateCCTPInput = z.infer<typeof updateCCTPSchema>
export type AnalyzeDocumentInput = z.infer<typeof analyzeDocumentSchema>

