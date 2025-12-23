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
    const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations d'entreprise à partir de documents de présentation (plaquettes commerciales, mémoires techniques, etc.).

Analyse le document suivant et extrais TOUTES les informations d'entreprise pertinentes de manière EXHAUSTIVE.

DOCUMENT:
${extractedText.substring(0, 50000)}

CONSIGNES IMPORTANTES:
- Extrais UNIQUEMENT les informations présentes dans le document
- Si une information n'est pas trouvée, laisse le champ vide (chaîne vide "")
- Sois EXHAUSTIF : extrais TOUT ce qui est mentionné, ne résume pas
- Conserve les listes avec des tirets (-) pour faciliter la lecture
- Pour les références chantiers, liste TOUS les projets mentionnés avec leurs détails
- Pour les moyens humains, détaille TOUS les postes et responsabilités
- Pour les moyens matériels, liste TOUS les équipements mentionnés avec leurs quantités
- Pour les certifications, liste TOUTES les qualifications (Qualibat, RGE, ISO, etc.)

Retourne un JSON avec cette structure exacte:
{
  "companyName": "nom exact de l'entreprise",
  "description": "présentation générale : historique, date de création, fondateur, localisation (ville, région), zone d'intervention géographique. Extrais les paragraphes complets.",
  "activities": "activités principales, corps d'état, spécialités, domaines d'intervention. Liste complète avec tirets.",
  "workforce": "effectifs détaillés avec TOUS les postes mentionnés et leurs responsabilités :\\n- Nombre total de personnes\\n- Chaque poste avec son rôle (conducteur travaux, chef de chantier, ouvriers, bureau d'études, administratif...)\\n- Organisation et hiérarchie\\n- Noms des responsables si mentionnés",
  "equipment": "TOUS les moyens matériels listés avec quantités :\\n- Locaux (surface dépôt, bureaux)\\n- Véhicules (nombre et types)\\n- Outillage et machines\\n- Équipements informatiques\\n- Échafaudages\\n- Tout autre équipement",
  "qualitySafety": "TOUT ce qui concerne qualité/sécurité/environnement :\\n- Certifications et qualifications (Qualibat, RGE, ISO...)\\n- Mesures de sécurité (EPI, formations, PPSPS...)\\n- Politique environnementale (bruit, poussière, déchets, consommation énergie...)\\n- Autocontrôles et contrôles qualité\\n- Propreté et hygiène chantier",
  "references": "TOUTES les références chantiers avec pour chacune :\\n- Nom du client/maître d'ouvrage\\n- Nom et localisation du projet\\n- Type de travaux réalisés\\n- Année si mentionnée",
  "workMethodology": "méthodologie de travail complète si présente :\\n- Phase étude/validation (démarches admin, plans, PPSPS, commandes...)\\n- Phase travaux (installation chantier, protections, étapes techniques...)\\n- Phase réception (autocontrôle, OPR, levée réserves, DOE...)\\n- Organisation en site occupé si mentionnée\\n- Gestion OPR et SAV",
  "writingGuidelines": "Analyse le STYLE RÉDACTIONNEL du document et propose des consignes pour reproduire ce style :\\n- Ton général (professionnel, technique, commercial, rassurant...)\\n- Niveau de détail (synthétique ou exhaustif)\\n- Vocabulaire utilisé (termes techniques récurrents, expressions-clés)\\n- Structure des phrases (courtes/longues, actives/passives)\\n- Points forts à reproduire dans les futurs mémoires"
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
