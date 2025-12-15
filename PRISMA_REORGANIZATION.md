# Réorganisation du schéma Prisma - Redyce V1

## Changements effectués

### 1. Enum DocumentType
- ✅ `TEMPLATE_MEMOIRE` → `MODELE_MEMOIRE` (cohérent avec le produit)
- ✅ Types conservés : AE, RC, CCAP, CCTP, DPGF, MODELE_MEMOIRE, AUTRE

### 2. Modèles supprimés (obsolètes/dupliqués)
- ❌ `Memory` (ancien modèle, remplacé par Memoire)
- ❌ `MemoryTemplate` (redondant, utilise Document avec type MODELE_MEMOIRE)
- ❌ `MemoryAnswer` (redondant, contenu dans MemoireSection.content)
- ❌ `MemoryExport` (supprimé pour V1, à réintroduire si besoin)
- ❌ `Citation` (redondant avec MemoireSourceLink)

### 3. Modèles renommés/réorganisés
- ✅ `TechnicalMemo` → `Memoire` (nommage cohérent produit)
- ✅ `MemoireSection` (consolidé, supprime duplication)
- ✅ Ajout `MemoireSourceLink` (nouveau pour traçabilité documents)

### 4. Relations nettoyées
- ✅ Project : supprime relations obsolètes (memoryTemplate, memorySections, memoryAnswers, memoryExports)
- ✅ Document : supprime relations obsolètes (templateDocuments, citations), ajoute memoireTemplates et memoireSources
- ✅ User : memoires au lieu de technicalMemos

## Nouveau schéma

### Structure principale

```
User (1) ────────< (N) Project (1) ────────< (N) Document
  │                    │                         │
  │                    ├─> Memoire (output)      ├─> Memoire.template
  │                    ├─> MemoireSection        └─> MemoireSourceLink
  │                    └─> Requirement
```

### Modèles clés

#### Document (Input)
- Types : AE, RC, CCAP, CCTP, DPGF, **MODELE_MEMOIRE**, AUTRE
- Relation : project (1-N)
- Index : projectId, documentType

#### Memoire (Output principal)
- Relation : project (N-1), user (N-1), template (N-1 Document de type MODELE_MEMOIRE)
- Sections : MemoireSection[]
- Index : projectId, userId, status, templateDocumentId, createdAt

#### MemoireSection
- Relation : memoire (N-1)
- Contenu : title, question, content, status
- Traçabilité : sourceRequirementIds[], sourceLinks[], requirementLinks[]
- Index : memoireId, order, status
- Unique : (memoireId, order)

#### MemoireSourceLink (Nouveau)
- Relation : section (N-1 MemoireSection), document (N-1 Document)
- Traçabilité : excerpt, pageNumber, relevance
- Index : sectionId, documentId
- Unique : (sectionId, documentId)

## Migration

**⚠️ IMPORTANT** : 
1. Le modèle Prisma s'appelle maintenant `Memoire` (cohérent produit)
2. La table PostgreSQL reste `technical_memos` (via `@@map`) pour compatibilité
3. Le code devra être mis à jour pour utiliser `prisma.memoire` au lieu de `prisma.technicalMemo`

## Commandes

```bash
# 1. Appliquer la migration (la migration SQL est déjà créée)
npx prisma migrate deploy

# OU pour développement (interactif)
npx prisma migrate dev --name reorganize_data_model

# 2. Régénérer le client Prisma
npx prisma generate

# 3. Vérifier que tout fonctionne
npx prisma studio
```

## Fichiers modifiés

- `prisma/schema.prisma` : réorganisation complète
- À mettre à jour après migration :
  - `src/services/technical-memo-service.ts` → utiliser `prisma.memoire`
  - `src/app/api/memos/**/*.ts` → utiliser `prisma.memoire`
  - `src/lib/utils/validation.ts` → types Memoire
  - `src/services/section-ai-service.ts` → utiliser `prisma.memoire`

