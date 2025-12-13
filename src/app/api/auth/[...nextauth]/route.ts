/**
 * Route NextAuth pour l'authentification
 * Gère toutes les routes /api/auth/*
 */

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/config"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
