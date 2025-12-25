const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

function hashString(content) {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex').substring(0, 16)
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

async function check() {
  const memoire = await prisma.memoire.findFirst({
    include: {
      sections: {
        where: { generationContextJson: { not: { equals: null } } },
        select: {
          id: true,
          title: true,
          generationContextJson: true
        },
        take: 1
      },
      project: {
        include: {
          requirements: true
        }
      }
    }
  })

  if (!memoire || !memoire.sections[0]) {
    console.log('Aucune section avec contexte')
    return
  }

  const section = memoire.sections[0]
  const storedHash = section.generationContextJson.requirementsHash

  // Calculer le hash actuel
  const currentHash = computeRequirementsHash(
    memoire.project.requirements.map(r => ({
      id: r.id,
      title: r.title || '',
      content: r.description || ''
    }))
  )

  console.log('Hash stocké:', storedHash)
  console.log('Hash actuel:', currentHash)
  console.log('Identiques?', storedHash === currentHash)
  console.log('Nb exigences stocké:', section.generationContextJson.sourceVersions?.requirementsCount)
  console.log('Nb exigences actuel:', memoire.project.requirements.length)

  await prisma.$disconnect()
}

check().catch(console.error)
