/**
 * Script pour relancer les analyses d'exigences qui ont échoué
 */

import { prisma } from '../src/lib/prisma/client'
import { jobQueue } from '../src/services/job-queue'

async function main() {
  const projectId = process.argv[2] || 'cmjga7lx2001r2cklbbz4nwph'
  
  try {
    console.log(`\n🔄 Relance des analyses d'exigences pour le projet ${projectId}\n`)
    
    // 1. Trouver tous les documents avec requirementStatus = ERROR ou qui n'ont pas de statut
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        OR: [
          { requirementStatus: 'ERROR' },
          { requirementStatus: null },
        ],
      },
      select: {
        id: true,
        name: true,
        projectId: true,
        requirementStatus: true,
      },
    })
    
    if (documents.length === 0) {
      console.log('✅ Aucun document à relancer')
      return
    }
    
    console.log(`📄 Documents à relancer (${documents.length}):`)
    documents.forEach((doc) => {
      console.log(`  - ${doc.name} (${doc.id})`)
    })
    
    // 2. Pour chaque document, créer un nouveau job REQUIREMENT_EXTRACTION
    let enqueued = 0
    let errors = 0
    
    for (const doc of documents) {
      try {
        // Récupérer le userId depuis le projet
        const project = await prisma.project.findUnique({
          where: { id: doc.projectId },
          select: { userId: true },
        })
        
        if (!project) {
          console.error(`❌ Projet ${doc.projectId} non trouvé`)
          errors++
          continue
        }
        
        // Créer un nouveau job avec priorité 10 (background)
        const job = await jobQueue.enqueueJob({
          type: 'REQUIREMENT_EXTRACTION',
          projectId: doc.projectId,
          documentId: doc.id,
          priority: 10, // Priorité basse (background)
          payload: {
            documentId: doc.id,
            userId: project.userId,
          },
        })
        
        console.log(`✅ Job créé pour ${doc.name}: ${job.id}`)
        enqueued++
      } catch (error: any) {
        console.error(`❌ Erreur pour ${doc.name}:`, error.message)
        errors++
      }
    }
    
    console.log(`\n📊 Résumé:`)
    console.log(`  Jobs créés: ${enqueued}`)
    console.log(`  Erreurs: ${errors}`)
    console.log(`\n✅ Les jobs seront traités par le worker en arrière-plan\n`)
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

