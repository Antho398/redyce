/**
 * Utilitaires pour vérifier les gardes-fous sur les mémoires
 * Notamment pour empêcher la modification de versions figées
 */

import { prisma } from '@/lib/prisma/client'
import { ValidationError } from './errors'

/**
 * Vérifie qu'un mémoire n'est pas figé avant de permettre une modification
 */
export async function ensureMemoireNotFrozen(memoireId: string): Promise<void> {
  const memoire = await prisma.memoire.findUnique({
    where: { id: memoireId },
    select: { id: true, isFrozen: true },
  })

  if (!memoire) {
    throw new ValidationError('Memoire not found')
  }

  if (memoire.isFrozen) {
    throw new ValidationError('Cannot modify a frozen memo version. Please create a new version.')
  }
}

