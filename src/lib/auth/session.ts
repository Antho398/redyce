/**
 * Helper pour récupérer la session côté serveur dans les routes API
 */

import { getServerSession } from "next-auth/next"
import { authOptions } from "./config"

/**
 * Récupère l'ID utilisateur depuis la session
 * Utilisé dans les routes API pour remplacer mock-user-id
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

/**
 * Récupère la session complète
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Vérifie si l'utilisateur est authentifié et retourne son ID
 * Lance une erreur avec status 401 si non authentifié
 */
export async function requireAuth(): Promise<string> {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    const error = new Error("Unauthorized: Authentication required") as Error & { statusCode?: number }
    error.statusCode = 401
    throw error
  }
  
  return session.user.id
}

