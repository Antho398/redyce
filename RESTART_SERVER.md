# ⚠️ IMPORTANT : Redémarrer le serveur Next.js

## Problème

Le message d'erreur "TechnicalMemo model is not available" indique que le serveur Next.js utilise une instance de Prisma Client qui a été créée **avant** la génération du modèle `TechnicalMemo`.

## Solution

**Vous devez redémarrer le serveur Next.js** pour que la nouvelle instance de Prisma Client (avec le modèle `TechnicalMemo`) soit chargée en mémoire.

### Étapes

1. **Arrêter le serveur Next.js** (Ctrl+C dans le terminal où il tourne)

2. **Vérifier que Prisma Client est généré** :
   ```bash
   npx prisma generate
   ```

3. **Redémarrer le serveur Next.js** :
   ```bash
   npm run dev
   ```

## Pourquoi ?

Next.js utilise un singleton Prisma Client qui est créé au démarrage du serveur. Si le serveur a été démarré avant d'exécuter `npx prisma generate`, l'instance en mémoire n'aura pas le modèle `TechnicalMemo`.

Le singleton Prisma utilise `globalThis` pour éviter de créer plusieurs instances, mais il ne se met pas à jour automatiquement quand le client Prisma est régénéré.

## Vérification

Après redémarrage, la page `/memoire` devrait fonctionner sans erreur.

