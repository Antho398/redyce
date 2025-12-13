/**
 * Helper centralisé pour récupérer l'utilisateur authentifié
 * 
 * Ce fichier fournit des helpers pour récupérer l'utilisateur connecté
 * côté serveur dans les routes API et Server Components.
 */

import { getServerSession } from "next-auth/next"
import { authOptions } from "./config"
import { prisma } from "@/lib/prisma/client"

/**
 * Récupère l'ID utilisateur depuis la session NextAuth
 * @returns L'ID utilisateur ou null si non authentifié
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

/**
 * Récupère l'ID utilisateur depuis la session NextAuth
 * Lance une erreur si l'utilisateur n'est pas authentifié
 * @returns L'ID utilisateur
 * @throws Error si non authentifié
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    throw new Error("Unauthorized: Authentication required")
  }
  
  return userId
}

/**
 * Récupère la session complète NextAuth
 * @returns La session ou null si non authentifié
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Récupère les données complètes de l'utilisateur depuis la base de données
 * @returns L'utilisateur complet ou null si non authentifié
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    return null
  }

  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Récupère les données complètes de l'utilisateur depuis la base de données
 * Lance une erreur si l'utilisateur n'est pas authentifié
 * @returns L'utilisateur complet
 * @throws Error si non authentifié
 */
export async function requireUser() {
  const userId = await requireAuth()
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

