import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// FORCER la réinitialisation en développement pour éviter les problèmes de cache
if (process.env.NODE_ENV !== 'production') {
  // Toujours réinitialiser en développement pour s'assurer d'avoir la dernière version
  if (globalForPrisma.prisma) {
    const hasMemoire = 'memoire' in globalForPrisma.prisma
    if (!hasMemoire) {
      console.warn('⚠️  Prisma client missing Memoire model, forcing reset...')
      // Déconnecter l'ancienne instance de manière asynchrone (sans bloquer)
      globalForPrisma.prisma.$disconnect().catch(() => {})
      // Forcer la réinitialisation immédiate
      globalForPrisma.prisma = undefined
    }
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Vérification au chargement que le modèle Memoire est disponible
if (process.env.NODE_ENV === 'development') {
  const hasMemoire = 'memoire' in prisma && typeof (prisma as any).memoire === 'object'
  if (!hasMemoire) {
    console.error(
      '❌ ERROR: Memoire model is not available in Prisma client.'
    )
    console.error('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).sort().join(', '))
    console.error('Please run: npx prisma generate && restart the Next.js server')
  } else {
    console.log('✅ Prisma client initialized with Memoire model')
  }
}

