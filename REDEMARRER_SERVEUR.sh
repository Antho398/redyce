#!/bin/bash
# Script pour redémarrer proprement le serveur Next.js

echo "🛑 Arrêt de tous les processus Next.js..."
pkill -f "next dev"
pkill -f "next-server"
sleep 2

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🚀 Démarrage du serveur Next.js..."
npm run dev

