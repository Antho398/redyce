/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions sont disponibles par défaut dans Next.js 14
  // Configuration pour les uploads de fichiers
  serverRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
}

module.exports = nextConfig

