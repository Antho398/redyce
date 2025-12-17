/**
 * Route API pour gérer le formulaire entreprise du template
 * GET /api/template-company-form/[projectId] - Récupère le formulaire
 * PUT /api/template-company-form/[projectId] - Met à jour les valeurs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types/api'
import { requireAuth } from '@/lib/auth/session'
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors'
import { z } from 'zod'

const updateFormSchema = z.object({
  values: z.record(z.string()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = await requireAuth()
  const { projectId } = params

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const templateDoc = await prisma.document.findFirst({
      where: { projectId, documentType: 'MODELE_MEMOIRE' },
      include: { templateCompanyForm: true },
    })

    if (!templateDoc || !templateDoc.templateCompanyForm) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Aucun formulaire entreprise trouvé' } },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: templateDoc.templateCompanyForm },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/template-company-form error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Project') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = await requireAuth()
  const { projectId } = params

  try {
    const body = await request.json()
    const { values } = updateFormSchema.parse(body)

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.userId !== userId) throw new UnauthorizedError('You do not have access to this project')

    const templateDoc = await prisma.document.findFirst({
      where: { projectId, documentType: 'MODELE_MEMOIRE' },
      include: { templateCompanyForm: true },
    })

    if (!templateDoc || !templateDoc.templateCompanyForm) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: 'Aucun formulaire entreprise trouvé' } },
        { status: 404 }
      )
    }

    // Mettre à jour les valeurs dans le champ fields
    // Gérer le cas spécial de companyPresentation qui n'est pas dans les fields originaux
    const companyPresentationValue = values['companyPresentation']
    const updatedFields = (templateDoc.templateCompanyForm.fields as any[]).map((field: any) => ({
      ...field,
      value: values[field.label] || field.value || '',
    }))
    
    // Si companyPresentation existe, l'ajouter comme un champ spécial dans le JSON
    // ou le stocker séparément dans les fields
    if (companyPresentationValue !== undefined) {
      // Vérifier si le champ companyPresentation existe déjà dans les fields
      const presentationFieldIndex = updatedFields.findIndex((f: any) => f.label === 'companyPresentation' || f.key === 'companyPresentation')
      if (presentationFieldIndex >= 0) {
        updatedFields[presentationFieldIndex].value = companyPresentationValue
      } else {
        // Ajouter le champ companyPresentation s'il n'existe pas
        updatedFields.push({
          key: 'companyPresentation',
          label: 'companyPresentation',
          type: 'textarea',
          value: companyPresentationValue,
          required: false,
        })
      }
    }

    const updated = await prisma.templateCompanyForm.update({
      where: { id: templateDoc.templateCompanyForm.id },
      data: { fields: updatedFields as any },
    })

    return NextResponse.json<ApiResponse>({ success: true, data: updated }, { status: 200 })
  } catch (error) {
    console.error('PUT /api/template-company-form error', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur – réessayez'
    const status =
      message.includes('NotFound') || message.includes('Project') ? 404 :
      message.includes('access') ? 403 : 500
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message } },
      { status }
    )
  }
}

