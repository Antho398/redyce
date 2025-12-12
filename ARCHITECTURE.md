# Architecture Finale - Redyce

## 📋 Vue d'Ensemble

Redyce est une application SaaS complète pour générer des mémoires techniques grâce à l'intelligence artificielle. L'application permet d'importer des documents (PDF, DOCX, images), de les analyser avec l'IA, d'extraire automatiquement des DPGF structurés, et de générer des CCTP.

---

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend**: Next.js 14 (App Router) + TypeScript + React
- **Backend**: Next.js API Routes (serverless)
- **Base de données**: PostgreSQL + Prisma ORM
- **IA**: OpenAI (GPT-4)
- **Parsing**: pdf-parse, mammoth, tesseract.js
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod

### Structure du Projet

```
redyce/
├── prisma/
│   └── schema.prisma              # Schéma de base de données
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (dashboard)/          # Pages authentifiées
│   │   │   ├── projects/         # Gestion projets
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── documents/  # Gestion documents
│   │   │   │   │   ├── dpgf/       # Gestion DPGF
│   │   │   │   │   └── cctp/       # Gestion CCTP
│   │   │   │   └── page.tsx       # Liste projets
│   │   │   └── layout.tsx
│   │   ├── api/                  # Routes API REST
│   │   │   ├── projects/         # API projets
│   │   │   ├── documents/        # API documents
│   │   │   ├── dpgf/            # API DPGF
│   │   │   ├── cctp/            # API CCTP
│   │   │   └── ai/              # API IA
│   │   └── page.tsx             # Page publique
│   │
│   ├── components/              # Composants React
│   │   ├── ui/                 # Composants UI de base
│   │   ├── documents/          # Composants documents
│   │   ├── dpgf/               # Composants DPGF
│   │   └── cctp/               # Composants CCTP
│   │
│   ├── hooks/                  # React Hooks
│   │   ├── useProjects.ts
│   │   ├── useDocuments.ts
│   │   ├── useDPGF.ts
│   │   ├── useCCTP.ts
│   │   └── useDocumentUpload.ts
│   │
│   ├── ia/                     # Module IA structuré
│   │   ├── client.ts           # Client OpenAI
│   │   ├── prompts/            # Prompts IA
│   │   │   ├── dpgf-extraction.ts
│   │   │   ├── cctp-generation.ts
│   │   │   └── document-analysis.ts
│   │   ├── pipelines/          # Pipelines IA
│   │   │   ├── dpgf-extraction-pipeline.ts
│   │   │   ├── cctp-generation-pipeline.ts
│   │   │   └── document-analysis-pipeline.ts
│   │   └── utils/              # Utilitaires IA
│   │       ├── structurizer.ts
│   │       └── validator.ts
│   │
│   ├── lib/                    # Bibliothèques
│   │   ├── documents/          # Parsing documents
│   │   │   ├── parser/         # Parsers (PDF, DOCX, images)
│   │   │   ├── extractors/     # Extracteurs par type
│   │   │   └── processors/     # Processeur orchestrateur
│   │   ├── prisma/             # Client Prisma
│   │   └── utils/              # Utilitaires
│   │
│   ├── services/               # Services métier
│   │   ├── project-service.ts
│   │   ├── document-service.ts
│   │   ├── dpgf-service.ts
│   │   ├── cctp-service.ts
│   │   ├── analysis-service.ts
│   │   └── memory-service.ts
│   │
│   ├── config/                 # Configuration
│   │   ├── env.ts              # Variables d'environnement
│   │   └── constants.ts        # Constantes
│   │
│   └── types/                  # Types TypeScript
│       ├── database.ts
│       ├── api.ts
│       ├── documents.ts
│       └── ai.ts
│
└── uploads/                    # Stockage fichiers (dev)
```

---

## 🔄 Workflow Complet

### 1. Upload et Parsing de Documents

```
Utilisateur upload un fichier
    ↓
DocumentUpload (composant)
    ↓
POST /api/documents/upload
    ↓
DocumentService.createDocument()
    ↓
Stockage fichier (fileStorage)
    ↓
Enregistrement en DB (status: uploaded)
```

### 2. Traitement de Document

```
POST /api/documents/[id]/parse
    ↓
DocumentService.processDocument()
    ↓
DocumentProcessor (détection MIME)
    ↓
Parser approprié (PDF/DOCX/Image)
    ↓
Extraction contenu
    ↓
Mise à jour DB (status: processed)
```

### 3. Extraction DPGF

```
POST /api/dpgf/extract
    ↓
DPGFService.extractDPGFFromDocument()
    ↓
Récupération contenu document traité
    ↓
extractDPGFPipeline (module IA)
    ↓
Prompt IA pour extraction structurée
    ↓
Retour JSON structuré
    ↓
Validation et normalisation
    ↓
Enregistrement DPGF en DB
```

### 4. Génération CCTP

```
POST /api/cctp/generate
    ↓
CCTPService.generateCCTPFromDPGF()
    ↓
Récupération DPGF structuré
    ↓
generateCCTPPipeline (module IA)
    ↓
Prompt IA avec contexte DPGF
    ↓
Génération CCTP structuré
    ↓
Conversion en texte formaté
    ↓
Enregistrement CCTP en DB
```

---

## 📊 Modèles de Données

### User
- Informations utilisateur
- Relations: projects, messages

### Project
- Projet utilisateur (appel d'offres)
- Relations: documents, memories, dpgfExtracts, cctpGenerated

### Document
- Fichier uploadé (PDF, DOCX, image)
- Statuts: uploaded → processing → processed/error
- Relations: project, analyses, knowledgeChunks

### DocumentAnalysis
- Résultat d'analyse d'un document
- Types: extraction, summary, qa, full
- Statuts: pending → processing → completed/error

### DPGFStructured
- DPGF extrait et structuré
- Contient données JSON structurées
- Score de confiance
- Relations: project, document, cctpGenerated

### CCTPGenerated
- CCTP généré depuis DPGF
- Contenu texte et structure JSON
- Gestion de versions
- Relations: project, dpgf

### Memory
- Mémoire technique généré (ancien modèle, maintenu pour compatibilité)

### ChatMessage
- Historique des échanges IA
- Relations: user, project

### KnowledgeChunk
- Chunks de connaissance pour recherche sémantique (futur)

---

## 🌐 Routes API

### Projects
- `GET /api/projects` - Liste projets utilisateur
- `POST /api/projects` - Créer projet
- `GET /api/projects/[id]` - Détails projet
- `PUT /api/projects/[id]` - Modifier projet
- `DELETE /api/projects/[id]` - Supprimer projet
- `GET /api/projects/[id]/documents` - Documents du projet

### Documents
- `GET /api/documents` - Liste documents
- `POST /api/documents` - Créer document
- `POST /api/documents/upload` - Upload fichier
- `GET /api/documents/[id]` - Détails document
- `DELETE /api/documents/[id]` - Supprimer document
- `POST /api/documents/[id]/parse` - Parser document

### DPGF
- `POST /api/dpgf/extract` - Extraire DPGF depuis document
- `GET /api/dpgf?projectId=xxx` - Liste DPGF projet
- `GET /api/dpgf/[id]` - Détails DPGF
- `PUT /api/dpgf/[id]` - Modifier DPGF
- `DELETE /api/dpgf/[id]` - Supprimer DPGF
- `POST /api/dpgf/[id]/validate` - Valider DPGF

### CCTP
- `POST /api/cctp/generate` - Générer CCTP
- `GET /api/cctp?projectId=xxx` - Liste CCTP projet
- `GET /api/cctp/[id]` - Détails CCTP
- `PUT /api/cctp/[id]` - Modifier CCTP
- `DELETE /api/cctp/[id]` - Supprimer CCTP
- `POST /api/cctp/[id]/finalize` - Finaliser CCTP
- `POST /api/cctp/[id]/version` - Nouvelle version

### IA
- `POST /api/ai/analyze` - Analyser document
- `POST /api/ai/memory` - Générer mémoire
- `POST /api/ai/chat` - Chat avec IA

---

## 🎯 Flux Utilisateur Typique

### Scénario 1: Extraction DPGF puis Génération CCTP

1. **Créer un projet**
   ```
   POST /api/projects
   { name: "Rénovation École", description: "..." }
   ```

2. **Uploader un document DPGF**
   ```
   POST /api/documents/upload
   FormData: { file: PDF, projectId: "...", documentType: "DPGF" }
   ```

3. **Parser le document**
   ```
   POST /api/documents/[id]/parse
   ```

4. **Extraire le DPGF structuré**
   ```
   POST /api/dpgf/extract
   { documentId: "..." }
   ```
   → Retourne DPGF structuré avec articles, matériaux, normes

5. **Générer le CCTP**
   ```
   POST /api/cctp/generate
   { dpgfId: "...", userRequirements: "..." }
   ```
   → Retourne CCTP complet généré

6. **Finaliser le CCTP**
   ```
   POST /api/cctp/[id]/finalize
   ```

### Scénario 2: Génération CCTP depuis Documents Bruts

1. **Uploader plusieurs documents** (CCTP, DPGF, RC, etc.)
2. **Parser tous les documents**
3. **Générer CCTP directement depuis documents**
   ```
   POST /api/cctp/generate
   { projectId: "...", userRequirements: "..." }
   ```

---

## 🔧 Services Métier

### DocumentService
- Création et gestion de documents
- Parsing multi-format
- Workflow upload → parse → analyse

### DPGFService
- Extraction DPGF depuis documents
- Validation et normalisation
- CRUD DPGF

### CCTPService
- Génération CCTP depuis DPGF
- Génération CCTP depuis documents
- Gestion de versions
- Finalisation

### AnalysisService
- Analyse générale de documents
- Extraction, résumé, Q&A

---

## 🤖 Module IA (`/src/ia`)

### Pipelines

1. **DPGF Extraction Pipeline**
   - Input: Contenu texte document
   - Output: DPGF structuré JSON
   - Validation automatique

2. **CCTP Generation Pipeline**
   - Input: DPGF structuré + exigences
   - Output: CCTP structuré + texte formaté
   - Validation automatique

3. **Document Analysis Pipeline**
   - Extraction d'informations
   - Résumé
   - Questions/Réponses

### Prompts

- Prompts spécialisés pour chaque type d'opération
- Context-aware (s'adaptent au contexte)
- Optimisés pour résultats JSON structurés

---

## 📦 Parsers

### Parser PDF
- Bibliothèque: `pdf-parse`
- Extraction: texte, métadonnées, pages

### Parser DOCX
- Bibliothèque: `mammoth`
- Extraction: texte, HTML (formatage), sections

### Parser Images (OCR)
- Bibliothèque: `tesseract.js` + `sharp`
- Extraction: texte via OCR, métadonnées
- Optimisation automatique pour meilleurs résultats

### Parser Unifié
- Détection automatique du type MIME
- Routing vers le bon parser
- Interface unifiée

---

## 🎨 Interface Utilisateur

### Pages Principales

1. **Dashboard Projets** (`/projects`)
   - Liste des projets
   - Création de projet
   - Navigation vers détails

2. **Détail Projet** (`/projects/[id]`)
   - Vue d'ensemble
   - Navigation: Documents, DPGF, CCTP
   - Statistiques

3. **Documents** (`/projects/[id]/documents`)
   - Upload multi-format
   - Liste des documents
   - Actions sur documents

4. **DPGF** (`/projects/[id]/dpgf`)
   - Liste des DPGF extraits
   - Visualisation structurée
   - Extraction depuis documents

5. **CCTP** (`/projects/[id]/cctp`)
   - Liste des CCTP générés
   - Visualisation texte/structure
   - Génération
   - Finalisation

### Composants Clés

- `DocumentUpload`: Upload avec drag & drop
- `DocumentList`: Liste avec statuts
- `DPGFViewer`: Visualisation structurée
- `CCTPGenerator`: Interface de génération
- `CCTPViewer`: Visualisation avec actions

---

## 🔐 Sécurité

### Validation
- Validation Zod sur tous les endpoints
- Validation des types MIME
- Limitation taille fichiers (50MB)

### Autorisation
- Vérification accès utilisateur sur toutes les opérations
- Isolation des données par utilisateur
- TODO: Implémenter authentification réelle

### Stockage
- Fichiers stockés localement (dev)
- TODO: Migrer vers S3 en production

---

## 🚀 Déploiement

### Développement
```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

### Production
```bash
npm run build
npm run start
```

### Variables d'Environnement
- `DATABASE_URL` - PostgreSQL
- `OPENAI_API_KEY` - OpenAI API
- `NODE_ENV` - Environment

---

## 📈 Évolutions Futures

### Court Terme
- [ ] Authentification complète (NextAuth)
- [ ] Export PDF/DOCX pour CCTP
- [ ] Recherche sémantique avec embeddings
- [ ] Amélioration extracteurs spécifiques

### Moyen Terme
- [ ] Queue pour traitement asynchrone (Bull)
- [ ] Stockage S3 pour fichiers
- [ ] Cache pour résultats IA
- [ ] Multi-tenancy

### Long Terme
- [ ] Collaboration multi-utilisateurs
- [ ] Templates de CCTP
- [ ] Intégration APIs externes
- [ ] Mobile app

---

## 🧪 Tests

### À Implémenter
- Tests unitaires services
- Tests d'intégration API
- Tests E2E workflows
- Tests parsers

---

## 📚 Documentation

- `README.md` - Guide général
- `INSTALL.md` - Guide d'installation
- `ARCHITECTURE.md` - Ce document
- `ANALYSIS.md` - Analyse initiale
- `IMPLEMENTATION_PLAN.md` - Plan d'implémentation
- Phase recaps (PHASE2_RECAP.md, etc.)

---

## ✅ Checklist Complétion

- [x] Parsers multi-format (PDF, DOCX, images)
- [x] Module IA structuré
- [x] Extraction DPGF automatique
- [x] Génération CCTP
- [x] Services métier complets
- [x] Routes API complètes
- [x] Validation Zod
- [x] Interface utilisateur
- [x] Hooks React
- [x] Documentation

---

**Architecture complète et fonctionnelle !** 🎉

