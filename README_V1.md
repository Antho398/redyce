# Redyce V1 - Mémoires Techniques pour Réponses aux Appels d'Offres

## Description du produit

Redyce est un SaaS B2B qui aide les entreprises du BTP à rédiger leurs mémoires techniques pour répondre aux appels d'offres.

### Fonctionnalités principales

- **Gestion de projets** : Organisation des appels d'offres par projet
- **Documents sources** : Upload et gestion des documents AO (AE, RC, CCAP, CCTP, DPGF)
- **Mémoire technique** : Éditeur structuré avec sections issues du modèle client
- **IA contextuelle** : Assistant pour compléter/reformuler les sections (utilise documents + profil entreprise)
- **Exigences** : Extraction automatique des exigences depuis les documents sources
- **Export DOCX** : Génération du mémoire final au format client
- **Versioning** : Gestion de versions (V1, V2, etc.) avec comparaison
- **Collaboration** : Commentaires et validation par rôles (OWNER, CONTRIBUTOR, REVIEWER)

## Prérequis

### Variables d'environnement (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/redyce"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI (pour l'IA)
OPENAI_API_KEY="sk-..."

# Storage (optionnel, par défaut local)
UPLOAD_DIR="./uploads"
```

### Base de données

PostgreSQL avec Prisma :

```bash
# Appliquer les migrations
npx prisma migrate deploy

# OU en développement
npx prisma migrate dev

# Générer le client Prisma
npx prisma generate
```

## Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npx prisma migrate deploy
npx prisma generate

# Lancer en développement
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

## Structure du produit

### Flux utilisateur principal

1. **Créer un projet** pour un appel d'offres
2. **Uploader des documents** sources (AE, RC, CCAP, CCTP, DPGF)
3. **Uploader le modèle de mémoire** (MODELE_MEMOIRE) - obligatoire
4. **Créer un mémoire technique** → génération automatique des sections depuis le modèle
5. **Rédiger les sections** manuellement ou avec l'aide de l'IA
6. **Extraire les exigences** depuis les documents sources
7. **Lier les exigences aux sections** pour la traçabilité
8. **Générer l'export DOCX** du mémoire final

### Rôles et permissions

- **OWNER** (propriétaire du projet) : Tous les droits
- **CONTRIBUTOR** : Éditer les sections, commenter
- **REVIEWER** : Commenter, valider les sections

### Versioning

- Chaque mémoire peut avoir plusieurs versions (V1, V2, etc.)
- Une version peut être "figée" (ne peut plus être modifiée)
- Comparaison section par section entre versions

## Architecture technique

### Stack

- **Frontend** : Next.js 14 (App Router) + TypeScript + React
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL + Prisma ORM
- **IA** : OpenAI (GPT-4o-mini)
- **UI** : Tailwind CSS + shadcn/ui

### Structure des dossiers

```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Pages authentifiées
│   │   ├── projects/        # Gestion projets
│   │   ├── memoire/         # Mémoires techniques
│   │   └── settings/        # Paramètres (profil entreprise)
│   └── api/                 # Routes API
├── components/              # Composants React
│   ├── memoire/            # Composants mémoire (éditeur, IA, etc.)
│   ├── requirements/       # Composants exigences
│   └── ui/                 # Composants UI de base (shadcn)
├── services/               # Services métier
│   ├── technical-memo-service.ts
│   ├── section-ai-service.ts
│   ├── requirement-service.ts
│   ├── memoire-export-service.ts
│   └── collaboration-service.ts
├── lib/                    # Utilitaires
│   ├── prisma/            # Client Prisma
│   ├── auth/              # Configuration NextAuth
│   └── utils/             # Utilitaires (validation, erreurs, etc.)
└── hooks/                 # Hooks React
```

## API Principales

### Projets
- `GET /api/projects` : Liste des projets de l'utilisateur
- `POST /api/projects` : Créer un projet
- `GET /api/projects/[id]` : Détails d'un projet
- `GET /api/projects/[id]/members` : Membres d'un projet
- `POST /api/projects/[id]/members` : Ajouter un membre (OWNER)

### Documents
- `POST /api/documents/upload` : Uploader un document
- `GET /api/projects/[id]/documents` : Documents d'un projet

### Mémoires
- `GET /api/memos` : Liste des mémoires (avec filtres)
- `POST /api/memos` : Créer un mémoire
- `GET /api/memos/[id]` : Détails d'un mémoire
- `GET /api/memos/[id]/sections` : Sections d'un mémoire
- `PUT /api/memos/[id]/sections/[sectionId]` : Modifier une section

### IA
- `POST /api/ia/section` : Générer une proposition IA pour une section

### Exigences
- `GET /api/requirements?projectId=` : Liste des exigences
- `POST /api/requirements/extract` : Extraire les exigences
- `PUT /api/requirements/[id]` : Modifier une exigence

### Export
- `POST /api/memos/[id]/export-docx` : Générer un export DOCX
- `GET /api/exports/[id]/download` : Télécharger un export

### Versioning
- `POST /api/memos/[id]/versions` : Créer une nouvelle version
- `GET /api/memos/[id]/versions` : Historique des versions
- `GET /api/memos/[id]/compare?versionId=` : Comparer deux versions

### Collaboration
- `POST /api/comments` : Créer un commentaire
- `GET /api/sections/[id]/comments` : Commentaires d'une section
- `POST /api/sections/[id]/validate` : Valider une section

## Sécurité

- Authentification obligatoire sur toutes les routes protégées (NextAuth)
- Vérification des permissions à chaque niveau (project → memoire → section)
- Isolation des données par utilisateur
- Pas d'exposition de contenu sensible dans les logs

## Performance

- Chunking automatique des documents pour l'IA (limite 15k caractères)
- Debounce sur l'autosave (800ms)
- Limitation à 10 documents maximum par contexte IA
- Pas de refetch inutile côté client

## Limitations V1

- Stockage local des fichiers (pas de S3)
- Pas de notifications en temps réel
- Pas de co-édition simultanée
- Export DOCX simple (pas de styles complexes du template)
- Pas de recherche avancée

## Support

Pour toute question ou problème, consulter :
- `TESTING_V1.md` : Guide de test manuel
- Logs serveur pour le debug (sans contenu sensible)
- Messages d'erreur clairs dans l'UI

