/**
 * Script de diagnostic pour vérifier l'état des exigences
 */

import { prisma } from '../src/lib/prisma/client'

async function main() {
  const projectId = process.argv[2] || 'cmjga7lx2001r2cklbbz4nwph'
  
  try {
    console.log(`\n🔍 Diagnostic pour le projet ${projectId}\n`)
    
    // 1. Vérifier les documents
    const documents = await prisma.document.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        requirementStatus: true,
        requirementProcessedAt: true,
        requirementErrorMessage: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`📄 Documents (${documents.length}):`)
    documents.forEach((doc) => {
      console.log(`  - ${doc.name}`)
      console.log(`    Status: ${doc.requirementStatus || 'NULL'}`)
      console.log(`    Processed: ${doc.requirementProcessedAt || 'NULL'}`)
      if (doc.requirementErrorMessage) {
        console.log(`    Error: ${doc.requirementErrorMessage}`)
      }
    })
    
    // 2. Vérifier les jobs
    const jobs = await prisma.job.findMany({
      where: {
        projectId,
        type: 'REQUIREMENT_EXTRACTION',
      },
      select: {
        id: true,
        documentId: true,
        status: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`\n🔧 Jobs REQUIREMENT_EXTRACTION (${jobs.length}):`)
    jobs.forEach((job) => {
      const doc = documents.find((d) => d.id === job.documentId)
      console.log(`  - Job ${job.id}`)
      console.log(`    Document: ${doc?.name || job.documentId}`)
      console.log(`    Status: ${job.status}`)
      console.log(`    Attempts: ${job.attempts}`)
      if (job.lastError) {
        console.log(`    Error: ${job.lastError}`)
      }
      console.log(`    Created: ${job.createdAt.toISOString()}`)
      console.log(`    Updated: ${job.updatedAt.toISOString()}`)
    })
    
    // 3. Vérifier les exigences
    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        documentId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    
    console.log(`\n📋 Exigences (${requirements.length} total, affichage des 10 dernières):`)
    requirements.forEach((req) => {
      const doc = documents.find((d) => d.id === req.documentId)
      console.log(`  - ${req.title.substring(0, 50)}...`)
      console.log(`    Document: ${doc?.name || req.documentId}`)
      console.log(`    Status: ${req.status}`)
    })
    
    // 4. Résumé
    console.log(`\n📊 Résumé:`)
    const doneDocs = documents.filter((d) => d.requirementStatus === 'DONE').length
    const doneJobs = jobs.filter((j) => j.status === 'DONE').length
    const failedJobs = jobs.filter((j) => j.status === 'FAILED').length
    const queuedJobs = jobs.filter((j) => j.status === 'QUEUED').length
    const runningJobs = jobs.filter((j) => j.status === 'RUNNING').length
    
    console.log(`  Documents avec requirementStatus=DONE: ${doneDocs}/${documents.length}`)
    console.log(`  Jobs DONE: ${doneJobs}`)
    console.log(`  Jobs FAILED: ${failedJobs}`)
    console.log(`  Jobs QUEUED: ${queuedJobs}`)
    console.log(`  Jobs RUNNING: ${runningJobs}`)
    console.log(`  Exigences totales: ${requirements.length}\n`)
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

