/**
 * Types pour les réponses API
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UploadResponse {
  documentId: string
  fileName: string
  fileSize: number
  status: string
}

export interface AnalysisResponse {
  analysisId: string
  status: string
  result?: unknown
}

export interface MemoryGenerationResponse {
  memoryId: string
  status: string
  content?: string
}

