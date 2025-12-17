/**
 * Route API pour générer une proposition de présentation d'entreprise avec l'IA
 * POST /api/template-company-form/[projectId]/generate-presentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { aiClient } from '@/lib/ai/client'
import { ApiResponse } from '@/types/api'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'

const COMPANY_PRESENTATION_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans la rédaction de mémoires techniques pour le BTP.
Ta mission est de générer une présentation d'entreprise professionnelle et formelle, rédigée à la 3e personne.

RÈGLES STRICTES :
1. Rédiger TOUJOURS à la 3e personne (ex: "L'entreprise X est spécialisée...")
2. Style formel et professionnel, conforme à un mémoire technique
3. Structure claire incluant : activité, expertise, zone d'intervention, valeurs (si pertinentes)
4. Texte continu, paragraphes fluides (pas de listes à puces)
5. Longueur : environ 150-250 mots
6. Ne pas inventer d'informations spécifiques si elles ne sont pas fournies
7. Utiliser des formulations neutres et professionnelles
8. Pas de marketing exagéré, rester factuel et crédible`

function buildCompanyPresentationPrompt(companyData: Record<string, string>, documentsContext: string[] = []): string {
  const companyName = companyData['Nom entreprise'] || companyData['Nom'] || 'l\'entreprise'
  const redacteur = companyData['Rédacteur'] || companyData['Nom du rédacteur'] || ''
  const date = companyData['Date'] || ''
  
  let context = `Génère une présentation d'entreprise professionnelle pour ${companyName}.`
  
  if (redacteur) {
    context += `\nRédacteur mentionné : ${redacteur}`
  }
  
  if (date) {
    context += `\nDate : ${date}`
  }

  // Ajouter le contexte des documents entreprise si disponibles
  if (documentsContext.length > 0) {
    context += `\n\nDocuments de référence fournis par l'entreprise :\n${documentsContext.join('\n\n---\n\n')}`
    context += `\n\nUtilise ces documents comme source d'information principale pour enrichir la présentation.`
  }
  
  context += `\n\nLa présentation doit être rédigée à la 3e personne, formelle, structurée et adaptée à un mémoire technique BTP.
Inclure les éléments suivants si appropriés :
- Description de l'activité principale
- Domaines d'expertise
- Zone(s) d'intervention géographique
- Valeurs ou atouts (de manière factuelle)`
  
  return context
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await requireAuth()
    const { projectId } = params

    // Vérifier que le projet existe et appartient à l'utilisateur
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Récupérer le template et les données du formulaire entreprise
    const templateDoc = await prisma.document.findFirst({
      where: {
        projectId,
        documentType: 'MODELE_MEMOIRE',
      },
    })

    if (!templateDoc) {
      throw new NotFoundError('Template', projectId)
    }

    const companyForm = await prisma.templateCompanyForm.findUnique({
      where: { documentId: templateDoc.id },
    })

    if (!companyForm) {
      throw new NotFoundError('CompanyForm', templateDoc.id)
    }

    // Extraire les données du formulaire (exclure companyPresentation)
    const fields = (companyForm.fields as any[]) || []
    const companyData: Record<string, string> = {}
    
    fields.forEach((field: any) => {
      if (field.label && field.value && field.label !== 'companyPresentation' && field.key !== 'companyPresentation') {
        companyData[field.label] = field.value
      }
    })

    // Récupérer les documents entreprise et leur contenu extrait
    const companyDocs = await prisma.document.findMany({
      where: {
        projectId,
        documentType: 'COMPANY_DOC',
        status: 'processed',
      },
      include: {
        analyses: {
          where: {
            analysisType: 'extraction',
            status: 'completed',
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Extraire le texte des documents
    const documentsContext: string[] = []
    companyDocs.forEach((doc) => {
      const analysis = doc.analyses[0]
      if (analysis?.result) {
        const result = analysis.result as any
        const text = result.extractedContent?.text || result.text || ''
        if (text.trim()) {
          documentsContext.push(`Document "${doc.name}":\n${text.substring(0, 2000)}`) // Limiter à 2000 caractères par document
        }
      }
    })

    // Construire le prompt avec contexte des documents si disponibles
    const prompt = buildCompanyPresentationPrompt(companyData, documentsContext)

    // Générer la présentation avec l'IA
    const response = await aiClient.generateResponse(
      {
        system: COMPANY_PRESENTATION_SYSTEM_PROMPT,
        user: prompt,
      },
      {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 400,
      }
    )

    return NextResponse.json<ApiResponse<{ presentation: string }>>(
      {
        success: true,
        data: { presentation: response.content.trim() },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating company presentation:', error)
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate company presentation',
        },
      },
      { 
        status: error instanceof NotFoundError ? 404 : 
                error instanceof UnauthorizedError ? 403 : 500 
      }
    )
  }
}

