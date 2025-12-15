# Résumé des changements Prisma - Réorganisation Redyce V1

## Fichiers modifiés

1. **`prisma/schema.prisma`**
   - Enum `DocumentType` : `TEMPLATE_MEMOIRE` → `MODELE_MEMOIRE`
   - Modèle `TechnicalMemo` → `Memoire` (avec `@@map("technical_memos")` pour compatibilité table)
   - Supprimé modèles obsolètes : `Memory`, `MemoryTemplate`, `MemoryAnswer`, `MemoryExport`, `Citation`
   - Ajouté `MemoireSourceLink` pour traçabilité documents
   - Nettoyé relations dans `Project`, `Document`, `User`

2. **`prisma/migrations/20241215000000_reorganize_data_model/migration.sql`** (nouveau)
   - Migration SQL pour appliquer les changements

## Commande Prisma à exécuter

```bash
# En développement (interactif)
npx prisma migrate dev --name reorganize_data_model

# OU si la migration existe déjà
npx prisma migrate deploy

# Puis régénérer le client
npx prisma generate
```

## Résumé du nouveau schéma

### Tables principales

#### **Project**
- Relations : `documents[]`, `memoires[]`, `requirements[]`
- Pas de relations obsolètes (memoryTemplate, memorySections, etc.)

#### **Document** (Inputs)
- Enum `DocumentType` : `AE | RC | CCAP | CCTP | DPGF | MODELE_MEMOIRE | AUTRE`
- Relations : `project`, `memoireTemplates[]` (mémoires utilisant ce doc comme template), `memoireSources[]`
- Index : `projectId`, `documentType`

#### **Memoire** (Output principal)
- **Table PostgreSQL** : `technical_memos` (via `@@map`)
- **Modèle Prisma** : `Memoire`
- Relations : `project`, `user`, `template` (Document de type MODELE_MEMOIRE), `sections[]`
- Champs : `id`, `projectId`, `userId`, `title`, `status`, `templateDocumentId`, `contentJson`, `contentText`, `version`, `metadata`
- Index : `projectId`, `userId`, `status`, `templateDocumentId`, `createdAt`

#### **MemoireSection**
- Relation : `memoire` (N-1), `sourceLinks[]`, `requirementLinks[]`
- Champs : `id`, `memoireId`, `title`, `order`, `question`, `status`, `content`, `sourceRequirementIds[]`
- Unique : `(memoireId, order)`
- Index : `memoireId`, `order`, `status`

#### **MemoireSourceLink** (Nouveau - Traçabilité)
- Relation : `section` (N-1 MemoireSection), `document` (N-1 Document)
- Champs : `id`, `sectionId`, `documentId`, `relevance`, `excerpt`, `pageNumber`, `metadata`
- Unique : `(sectionId, documentId)`
- Index : `sectionId`, `documentId`

#### **Requirement**
- Relations : `project`, `document` (optionnel), `sectionLinks[]`
- Champs : `id`, `projectId`, `documentId`, `code`, `title`, `description`, `category`, `priority`, `status`, `sourcePage`, `sourceQuote`
- Index : `projectId`, `documentId`, `category`, `status`

#### **RequirementLink**
- Relation : `section` (MemoireSection), `requirement` (Requirement)
- Unique : `(sectionId, requirementId)`
- Index : `sectionId`, `requirementId`

### Relations principales

```
User (1) ────────< (N) Project (1) ────────< (N) Document
  │                    │                         │
  │                    ├─> Memoire (output)      ├─> Memoire.template
  │                    │   ├─> MemoireSection   └─> MemoireSourceLink.document
  │                    │   └─> MemoireSourceLink
  │                    │
  │                    └─> Requirement
  │                        └─> RequirementLink ──> MemoireSection
```

### Modèles supprimés

- ❌ `Memory` (ancien, remplacé par Memoire)
- ❌ `MemoryTemplate` (redondant, utilise Document avec type MODELE_MEMOIRE)
- ❌ `MemoryAnswer` (redondant, contenu dans MemoireSection.content)
- ❌ `MemoryExport` (supprimé pour V1)
- ❌ `Citation` (remplacé par MemoireSourceLink)

## ⚠️ Actions post-migration requises

Après avoir appliqué la migration et régénéré le client Prisma :

1. **Mettre à jour le code TypeScript** :
   - `prisma.technicalMemo` → `prisma.memoire`
   - Types `TechnicalMemo` → `Memoire`

2. **Fichiers à modifier** :
   - `src/services/technical-memo-service.ts`
   - `src/app/api/memos/**/*.ts`
   - `src/services/section-ai-service.ts`
   - `src/lib/utils/validation.ts`

3. **Adapter les validations Zod** :
   - `createTechnicalMemoSchema` → `createMemoireSchema`
   - Types associés

## Validation

Le schéma est valide :
```bash
npx prisma validate  # ✅ Valide
```

