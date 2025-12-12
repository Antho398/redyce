# Guide d'Installation - Redyce

Ce guide vous explique comment initialiser et lancer le projet Redyce.

## Prérequis

- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution
- Un compte OpenAI avec une clé API (optionnel pour démarrer)

## Étapes d'Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/redyce?schema=public"

# AI Provider (optionnel pour démarrer)
OPENAI_API_KEY="your-openai-api-key"

# App Configuration
NODE_ENV="development"
MAX_FILE_SIZE=52428800
UPLOAD_DIR="./uploads"
```

**Important**: Remplacez `user`, `password`, et `redyce` par vos valeurs PostgreSQL réelles.

### 3. Créer la base de données PostgreSQL

```bash
# Si vous utilisez psql
createdb redyce

# Ou créez-la via votre interface PostgreSQL
```

### 4. Initialiser la base de données avec Prisma

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables dans la base de données
npm run db:push
```

**Note**: Pour la production, utilisez plutôt `npm run db:migrate` pour créer des migrations versionnées.

### 5. Vérifier l'installation

```bash
# Lancer le serveur de développement
npm run dev
```

L'application devrait être accessible sur [http://localhost:3000](http://localhost:3000).

### 6. Vérifier la connexion à la base de données (optionnel)

```bash
# Ouvrir Prisma Studio pour visualiser la base de données
npm run db:studio
```

## Structure de la Base de Données

Le schéma Prisma contient les entités suivantes:
- **User**: Utilisateurs de l'application
- **Project**: Projets utilisateur (appels d'offres / mémoires)
- **Document**: Fichiers uploadés (CCTP, DPGF, RC, CCAP...)
- **DocumentAnalysis**: Résultats d'analyse des documents
- **Memory**: Mémoires techniques générés pour un projet
- **ChatMessage**: Historique des échanges IA sur un projet
- **KnowledgeChunk**: Chunks de connaissance pour recherche sémantique (futur)

## Vérification Post-Installation

1. ✅ Le serveur démarre sans erreur
2. ✅ La page d'accueil s'affiche sur http://localhost:3000
3. ✅ La page dashboard `/projects` affiche une liste factice de projets
4. ✅ La base de données contient les tables générées

## Prochaines Étapes

1. Implémenter l'authentification complète
2. Connecter les routes API aux services métier
3. Intégrer la logique IA depuis Buildismart
4. Intégrer les extracteurs de documents depuis RenovIA

## Dépannage

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez la `DATABASE_URL` dans `.env.local`
- Assurez-vous que la base de données `redyce` existe

### Erreur "Prisma Client not generated"
- Exécutez `npm run db:generate`

### Erreurs TypeScript
- Vérifiez que tous les fichiers ont été créés
- Exécutez `npm install` à nouveau

