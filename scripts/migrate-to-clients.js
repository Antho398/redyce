/**
 * Script de migration : CompanyProfile → Client
 * Migre les données existantes vers l'architecture multi-clients
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Démarrage de la migration vers l\'architecture multi-clients...\n')

  try {
    // 1. Récupérer tous les utilisateurs avec leur profil d'entreprise
    const users = await prisma.user.findMany({
      include: {
        companyProfile: true,
      },
    })

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`)

    for (const user of users) {
      console.log(`👤 Migration pour l'utilisateur: ${user.email}`)

      // Vérifier si l'utilisateur a déjà un client par défaut
      const existingClient = await prisma.client.findFirst({
        where: {
          userId: user.id,
          name: 'Client par défaut',
        },
      })

      if (existingClient) {
        console.log(`   ℹ️  Client par défaut déjà existant, passage au suivant...`)
        continue
      }

      // 2. Créer un client par défaut avec les données du CompanyProfile
      const profile = user.companyProfile
      const defaultClient = await prisma.client.create({
        data: {
          userId: user.id,
          name: 'Client par défaut',
          companyName: profile?.companyName || 'Mon Entreprise',
          description: profile?.description || null,
          activities: profile?.activities || null,
          workforce: profile?.workforce || null,
          equipment: profile?.equipment || null,
          qualitySafety: profile?.qualitySafety || null,
          references: profile?.references || null,
          writingStyle: profile?.writingStyle || null,
          writingTone: profile?.writingTone || null,
          writingGuidelines: profile?.writingGuidelines || null,
          forbiddenWords: profile?.forbiddenWords || null,
          preferredTerms: profile?.preferredTerms || null,
          websiteUrl: profile?.websiteUrl || null,
          scrapedData: profile?.scrapedData || undefined,
          lastScrapedAt: profile?.lastScrapedAt || undefined,
        },
      })

      console.log(`   ✅ Client par défaut créé: ${defaultClient.id}`)

      // 3. Lier tous les projets existants à ce client (via SQL brut pour gérer IS NULL)
      const projectsResult = await prisma.$executeRaw`
        UPDATE projects
        SET "clientId" = ${defaultClient.id}
        WHERE "userId" = ${user.id} AND "clientId" IS NULL
      `

      console.log(`   ✅ ${projectsResult} projet(s) lié(s) au client par défaut`)

      // 4. Lier tous les documents de méthodologie à ce client (via SQL brut)
      const docsResult = await prisma.$executeRaw`
        UPDATE methodology_documents
        SET "clientId" = ${defaultClient.id}
        WHERE "userId" = ${user.id} AND "clientId" IS NULL
      `

      console.log(`   ✅ ${docsResult} document(s) de méthodologie lié(s) au client par défaut\n`)
    }

    console.log('✨ Migration terminée avec succès !')
    console.log('\n📋 Résumé:')

    const totalClients = await prisma.client.count()
    const totalProjectsLinked = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM projects WHERE "clientId" IS NOT NULL
    `
    const totalDocsLinked = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM methodology_documents WHERE "clientId" IS NOT NULL
    `

    console.log(`   - Clients créés: ${totalClients}`)
    console.log(`   - Projets liés: ${totalProjectsLinked[0].count}`)
    console.log(`   - Documents liés: ${totalDocsLinked[0].count}`)

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Le script a échoué:', error)
    process.exit(1)
  })
