/**
 * Types générés depuis Prisma
 * Utilisez `npx prisma generate` pour régénérer ces types
 */

export type {
  User,
  Project,
  Document,
  DocumentAnalysis,
  Memory,
  ChatMessage,
  KnowledgeChunk,
} from '@prisma/client'

export type ProjectWithDocuments = Project & {
  documents: Document[]
  _count?: {
    documents: number
    memories: number
  }
}

export type DocumentWithAnalysis = Document & {
  analyses: DocumentAnalysis[]
  _count?: {
    analyses: number
  }
}

export type MemoryWithProject = Memory & {
  project: Project
}

