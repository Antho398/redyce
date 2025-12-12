/**
 * Module IA structuré - Exports principaux
 */

// Client IA
export { iaClient } from './client'

// Pipelines
export { extractDPGFPipeline } from './pipelines/dpgf-extraction-pipeline'
export { generateCCTPPipeline, formatCCTPAsText } from './pipelines/cctp-generation-pipeline'
export { analyzeDocumentPipeline } from './pipelines/document-analysis-pipeline'

// Prompts (si besoin d'utilisation directe)
export * from './prompts/dpgf-extraction'
export * from './prompts/cctp-generation'
export * from './prompts/document-analysis'

// Utilitaires
export * from './utils/structurizer'
export * from './utils/validator'

// Types
export type { DPGFExtractedData, DPGFExtractionPipelineOptions, DPGFExtractionResult } from './pipelines/dpgf-extraction-pipeline'
export type { CCTPGeneratedData, CCTPGenerationPipelineOptions, CCTPGenerationResult } from './pipelines/cctp-generation-pipeline'
export type { DocumentAnalysisPipelineOptions, DocumentAnalysisResult } from './pipelines/document-analysis-pipeline'

