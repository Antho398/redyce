/**
 * Script pour rétro-remplir le contexte de génération sur les sections existantes
 * Permet d'activer la détection de sections obsolètes pour les mémoires existants
 */

const { PrismaClient, Prisma } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

function hashString(content) {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex').substring(0, 16)
}

function computeCompanyProfileHash(dataJson) {
  if (!dataJson) return ''
  const sorted = JSON.stringify(dataJson, Object.keys(dataJson).sort())
  return hashString(sorted)
}

function computeRequirementsHash(requirements) {
  if (!requirements || requirements.length === 0) return ''
  const sorted = requirements
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(r => `${r.id}:${r.title || ''}:${r.content || ''}`)
    .join('|')
  return hashString(sorted)
}

function computeCompanyDocsHash(docs) {
  if (!docs || docs.length === 0) return ''
  const sorted = docs
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(d => `${d.id}:${d.extractedContent || ''}`)
    .join('|')
  return hashString(sorted)
}

function computeQuestionHash(question) {
  if (!question) return ''
  return hashString(question)
}

async function backfill() {
  // Récupérer toutes les sections avec contenu mais sans contexte
  const sections = await prisma.memoireSection.findMany({
    where: {
      content: { not: '' },
      generationContextJson: { equals: Prisma.DbNull }
    },
    include: {
      memoire: {
        include: {
          project: {
            include: {
              requirements: true
            }
          }
        }
      }
    }
  })

  console.log(`Sections à mettre à jour: ${sections.length}`)

  for (const section of sections) {
    const userId = section.memoire.userId
    const projectId = section.memoire.projectId

    // Récupérer le profil entreprise
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId }
    })

    // Récupérer les documents de méthodologie
    const methodologyDocs = await prisma.methodologyDocument.findMany({
      where: { userId },
      select: { id: true, extractedText: true }
    })

    const generationContext = {
      companyProfileHash: computeCompanyProfileHash(companyProfile),
      requirementsHash: computeRequirementsHash(
        section.memoire.project.requirements.map(r => ({
          id: r.id,
          title: r.title || '',
          content: r.description || ''
        }))
      ),
      companyDocsHash: computeCompanyDocsHash(
        methodologyDocs.map(d => ({
          id: d.id,
          extractedContent: d.extractedText || ''
        }))
      ),
      questionHash: computeQuestionHash(section.question),
      generatedAt: new Date().toISOString(),
      sourceVersions: {
        requirementsCount: section.memoire.project.requirements.length,
        companyDocsCount: methodologyDocs.length
      }
    }

    await prisma.memoireSection.update({
      where: { id: section.id },
      data: {
        generationContextJson: generationContext,
        generatedAt: new Date()
      }
    })

    const title = (section.title || section.question || 'Sans titre').substring(0, 50)
    console.log(`✓ ${title}`)
  }

  console.log('\nTerminé!')
  await prisma.$disconnect()
}

backfill().catch(err => {
  console.error('Erreur:', err)
  prisma.$disconnect()
  process.exit(1)
})
