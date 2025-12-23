/**
 * Route API pour l'upload temporaire d'un document pour extraction d'infos entreprise
 * POST /api/company-profile/extract-temp
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { ApiResponse } from '@/types/api'
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { aiClient } from '@/lib/ai/client'
import { MAX_FILE_SIZE } from '@/config/constants'
import { UsageTracker } from '@/services/usage-tracker'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const formData = await request.formData()

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'No file provided' },
        },
        { status: 400 }
      )
    }

    // Valider la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: `File size exceeds maximum of ${MAX_FILE_SIZE} bytes` },
        },
        { status: 400 }
      )
    }

    // Valider le type MIME
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]

    let mimeType = file.type || ''
    if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
      const { detectMimeTypeFromFilename } = await import('@/lib/documents/parser')
      const detected = detectMimeTypeFromFilename(file.name)
      if (detected && supportedMimeTypes.includes(detected)) {
        mimeType = detected
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: { message: 'Unsupported file type. Supported: PDF, DOCX, DOC' },
          },
          { status: 400 }
        )
      }
    }

    // Parser le document directement sans le sauvegarder
    const buffer = Buffer.from(await file.arrayBuffer())
    const processor = new DocumentProcessor()
    const parsed = await processor.processDocument(buffer, mimeType, 'AUTRE')

    const extractedText = parsed.extractedContent?.text || ''

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Unable to extract text from document' },
        },
        { status: 400 }
      )
    }

    // Utiliser l'IA pour extraire les informations d'entreprise
    const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations d'entreprise à partir de documents.

Analyse le document suivant et extrais les informations d'entreprise pertinentes.

DOCUMENT:
${extractedText.substring(0, 50000)}

CONSIGNES:
- Extrais UNIQUEMENT les informations présentes dans le document
- Si une information n'est pas trouvée, laisse le champ vide
- Sois précis et factuel
- Pour les champs textuels longs, extrais les paragraphes complets

Retourne un JSON avec cette structure exacte:
{
  "companyName": "nom de l'entreprise",
  "description": "description de l'entreprise",
  "activities": "activités principales",
  "workforce": "effectif et organisation",
  "equipment": "moyens matériels et techniques",
  "qualitySafety": "démarche qualité et sécurité",
  "references": "références et réalisations"
}

RÉPONDS UNIQUEMENT AVEC LE JSON, sans texte avant ou après.`

    const userId = await requireAuth()
    const response = await aiClient.generateResponse(
      { user: extractionPrompt },
      { temperature: 0.1 }
    )
    const result = response.content

    // Tracker l'usage IA
    if (response.metadata?.inputTokens && response.metadata?.outputTokens) {
      await UsageTracker.recordUsage(
        userId,
        response.metadata.model || 'gpt-4-turbo-preview',
        response.metadata.inputTokens,
        response.metadata.outputTokens,
        'company_profile_extraction'
      )
    }

    // Parser la réponse JSON
    let extractedInfo
    try {
      // Nettoyer la réponse pour extraire uniquement le JSON
      const cleanedResponse = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      extractedInfo = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Failed to parse extraction results' },
        },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          extractedInfo,
          documentName: file.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error extracting company info:', error)

    const message = error instanceof Error ? error.message : 'Failed to extract company information'

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { message },
      },
      { status: 500 }
    )
  }
}
