/**
 * Route API pour extraire automatiquement les informations d'entreprise depuis un document
 * POST /api/methodology-documents/[id]/extract-company-info - Extraire les infos
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { streamText } from '@/lib/ai/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    const { id: documentId } = params

    // Récupérer le document avec son texte extrait
    const document = await prisma.methodologyDocument.findFirst({
      where: {
        id: documentId,
        userId,
      },
    })

    if (!document) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'Document not found or access denied' },
        },
        { status: 404 }
      )
    }

    // Vérifier qu'on a du contenu extrait
    const documentContent = document.extractedText

    if (!documentContent || documentContent.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { message: 'No text extracted from document yet. Please wait a moment and try again.' },
        },
        { status: 400 }
      )
    }

    // Utiliser l'IA pour extraire les informations d'entreprise
    const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations d'entreprise à partir de documents.

Analyse le document suivant et extrais les informations d'entreprise pertinentes.

DOCUMENT:
${documentContent.substring(0, 50000)}

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

    const result = await streamText({
      prompt: extractionPrompt,
      temperature: 0.1,
    })

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
          documentName: document.name,
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
