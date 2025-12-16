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
  documentType: z.enum(['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'MODELE_MEMOIRE', 'AUTRE']),
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

// Schémas TechnicalMemo
export const createTechnicalMemoSchema = z.object({
  projectId: z.string().cuid(),
  templateDocumentId: z.string().cuid().optional(), // Optionnel : utilise le premier MODELE_MEMOIRE si non fourni
  title: z.string().min(1, 'Le titre est requis'),
})

export const updateTechnicalMemoSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'READY', 'EXPORTED']).optional(),
  contentJson: z.any().optional(),
  contentText: z.string().optional(),
})

export const getTechnicalMemosQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'READY', 'EXPORTED']).optional(),
  q: z.string().optional(),
})

export type CreateTechnicalMemoInput = z.infer<typeof createTechnicalMemoSchema>
export type UpdateTechnicalMemoInput = z.infer<typeof updateTechnicalMemoSchema>
export type GetTechnicalMemosQuery = z.infer<typeof getTechnicalMemosQuerySchema>

// Schémas pour sections mémoire
export const updateMemoireSectionSchema = z.object({
  title: z.string().min(1).optional(),
  question: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'VALIDATED']).optional(),
  content: z.string().optional().nullable(),
  sourceRequirementIds: z.array(z.string().cuid()).optional(),
})

export type UpdateMemoireSectionInput = z.infer<typeof updateMemoireSectionSchema>

// Schémas pour IA section
export const sectionAIActionSchema = z.object({
  projectId: z.string().cuid(),
  memoireId: z.string().cuid(),
  sectionId: z.string().cuid(),
  actionType: z.enum(['complete', 'reformulate', 'shorten', 'extractRequirements']),
  responseLength: z.enum(['short', 'standard', 'detailed']).optional(),
})

export type SectionAIActionInput = z.infer<typeof sectionAIActionSchema>
export type GenerateCCTPFromDocumentsInput = z.infer<typeof generateCCTPFromDocumentsSchema>
export type UpdateCCTPInput = z.infer<typeof updateCCTPSchema>
export type AnalyzeDocumentInput = z.infer<typeof analyzeDocumentSchema>

// Schémas pour mémoire template
export const parseMemoryTemplateSchema = z.object({
  projectId: z.string().cuid(),
})

export const createMemoryTemplateSchema = z.object({
  projectId: z.string().cuid(),
  documentId: z.string().cuid(),
  name: z.string().optional(),
})

// Schémas pour sections mémoire
export const generateSectionAnswerSchema = z.object({
  sectionId: z.string().cuid(),
  userContext: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const updateSectionAnswerSchema = z.object({
  contentHtml: z.string(),
  status: z.enum(['DRAFT', 'READY', 'REVIEWED']).optional(),
})

// Schémas pour exigences
export const getRequirementsQuerySchema = z.object({
  projectId: z.string().cuid(),
  category: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COVERED']).optional(),
  priority: z.enum(['LOW', 'MED', 'HIGH']).optional(),
  documentType: z.string().optional(),
  q: z.string().optional(), // Recherche textuelle
})

export const extractRequirementsSchema = z.object({
  projectId: z.string().cuid(),
})

export const mapRequirementsSchema = z.object({
  projectId: z.string().cuid(),
})

export const updateRequirementSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MED', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COVERED']).optional(),
  sourceQuote: z.string().optional(),
  sourcePage: z.number().int().positive().optional(),
})

export const linkRequirementToSectionSchema = z.object({
  sectionId: z.string().cuid(),
})

// Schémas pour export mémoire
export const exportMemorySchema = z.object({
  projectId: z.string().cuid(),
  format: z.enum(['docx', 'pdf']).default('docx'),
})

export type ParseMemoryTemplateInput = z.infer<typeof parseMemoryTemplateSchema>
export type CreateMemoryTemplateInput = z.infer<typeof createMemoryTemplateSchema>
export type UpdateSectionAnswerInput = z.infer<typeof updateSectionAnswerSchema>
export type ExtractRequirementsInput = z.infer<typeof extractRequirementsSchema>
export type MapRequirementsInput = z.infer<typeof mapRequirementsSchema>
export type ExportMemoryInput = z.infer<typeof exportMemorySchema>

