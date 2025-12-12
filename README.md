# Redyce

Génération de mémoires techniques avec intelligence artificielle.

## Description

Redyce est un SaaS qui permet de générer des mémoires techniques grâce à l'intelligence artificielle en intégrant des documents techniques, en analysant des PDF (CCTP, DPGF, RC, CCAP…) et en posant des questions au concepteur du mémoire.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL avec Prisma ORM
- **AI**: OpenAI (extensible pour d'autres providers)
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod

## Installation

1. Installer les dépendances:
```bash
npm install
```

2. Configurer les variables d'environnement:
```bash
cp .env.example .env.local
```

Éditer `.env.local` et remplir les valeurs nécessaires:
- `DATABASE_URL`: URL de connexion PostgreSQL
- `OPENAI_API_KEY`: Clé API OpenAI

3. Configurer la base de données:
```bash
npm run db:generate  # Générer le client Prisma
npm run db:push      # Créer les tables
```

4. Lancer le serveur de développement:
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## Structure du Projet

```
src/
├── app/              # Next.js App Router (pages et routes API)
├── components/       # Composants React
├── config/           # Configuration (env, constantes)
├── hooks/            # React Hooks personnalisés
├── lib/              # Bibliothèques utilitaires
│   ├── ai/          # Logique IA (prompts, pipelines)
│   ├── documents/   # Ingestion documentaire (parsing, extraction)
│   ├── prisma/      # Client Prisma
│   └── utils/       # Fonctions utilitaires
├── services/         # Services métier
└── types/            # Types TypeScript
```

## Routes API

- `GET/POST /api/projects` - Gestion des projets
- `GET/PUT/DELETE /api/projects/[id]` - Opérations sur un projet
- `POST /api/documents/upload` - Upload de documents
- `POST /api/documents/[id]/parse` - Parsing d'un document
- `POST /api/ai/analyze` - Analyse de documents avec IA
- `POST /api/ai/memory` - Génération de mémoires
- `POST /api/ai/chat` - Chat avec l'IA

## Scripts Disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Linter ESLint
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser le schéma vers la DB
- `npm run db:migrate` - Créer une migration
- `npm run db:studio` - Ouvrir Prisma Studio

## Architecture Modulaire

Le projet est conçu pour intégrer facilement:
- L'ingestion et parsing depuis RenovIA (via `src/lib/documents/`)
- Les prompts et logique IA depuis Buildismart (via `src/lib/ai/`)

## TODO

- [ ] Implémenter l'authentification complète
- [ ] Ajouter les tests
- [ ] Intégrer le stockage S3 pour la production
- [ ] Améliorer les extracteurs de documents spécifiques
- [ ] Ajouter la recherche sémantique avec embeddings

