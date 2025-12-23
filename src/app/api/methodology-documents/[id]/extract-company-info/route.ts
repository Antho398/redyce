/**
 * Route API pour extraire automatiquement les informations d'entreprise depuis un document
 * POST /api/methodology-documents/[id]/extract-company-info - Extraire les infos
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { ApiResponse } from '@/types/api'
import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { UsageTracker } from '@/services/usage-tracker'

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
    const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations d'entreprise à partir de documents de présentation (plaquettes commerciales, mémoires techniques, etc.).

Analyse le document suivant et extrais TOUTES les informations d'entreprise pertinentes de manière EXHAUSTIVE.

DOCUMENT:
${documentContent.substring(0, 50000)}

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

    const response = await aiClient.generateResponse(
      { user: extractionPrompt },
      { temperature: 0.1 }
    )

    // Tracker l'usage IA
    if (response.metadata?.inputTokens && response.metadata?.outputTokens) {
      await UsageTracker.recordUsage(
        userId,
        response.metadata.model || 'gpt-4-turbo-preview',
        response.metadata.inputTokens,
        response.metadata.outputTokens,
        'company_profile_extraction_from_doc',
        { documentId }
      )
    }

    // Parser la réponse JSON
    let extractedInfo
    try {
      // Nettoyer la réponse pour extraire uniquement le JSON
      const cleanedResponse = response.content
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
