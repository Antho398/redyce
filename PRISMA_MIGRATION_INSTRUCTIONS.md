# Instructions de migration Prisma - Réorganisation Redyce V1

## Résumé des changements

### ✅ Modifications effectuées

1. **Enum DocumentType**
   - `TEMPLATE_MEMOIRE` → `MODELE_MEMOIRE`
   - Types conservés : AE, RC, CCAP, CCTP, DPGF, MODELE_MEMOIRE, AUTRE

2. **Modèle renommé**
   - `TechnicalMemo` → `Memoire`
   - Table PostgreSQL : `technical_memos` (conservée via `@@map`)

3. **Modèles supprimés**
   - `Memory` (ancien)
   - `MemoryTemplate` (redondant)
   - `MemoryAnswer` (redondant)
   - `MemoryExport` (supprimé V1)
   - `Citation` (remplacé par MemoireSourceLink)

4. **Nouveau modèle**
   - `MemoireSourceLink` : traçabilité documents → sections

5. **Relations nettoyées**
   - Project : relations obsolètes supprimées
   - Document : relations nettoyées, ajout memoireTemplates et memoireSources

## Commande à exécuter

```bash
# 1. Appliquer la migration
npx prisma migrate deploy

# OU en développement (interactif)
npx prisma migrate dev --name reorganize_data_model

# 2. Régénérer le client Prisma
npx prisma generate

# 3. Vérifier
npx prisma validate
```

## Nouveau schéma - Tables et relations

### Tables principales

| Table | Description | Relations |
|-------|-------------|-----------|
| `documents` | **Inputs** : Documents sources (AE, RC, CCAP, CCTP, DPGF, MODELE_MEMOIRE, AUTRE) | → Project |
| `technical_memos` | **Output** : Mémoires techniques générés/édités | → Project, User, Document (template) |
| `memoire_sections` | Sections/questions du mémoire | → Memoire |
| `memoire_source_links` | Traçabilité : liens section ↔ document | → MemoireSection, Document |
| `requirements` | Exigences extraites des documents AO | → Project, Document (optionnel) |
| `requirement_links` | Liens exigence ↔ section | → Requirement, MemoireSection |

### Relations clés

```
Project (1) ────────< (N) Document (inputs)
  │                       │
  │                       ├─> type = MODELE_MEMOIRE (template)
  │                       └─> types = AE, RC, CCAP, CCTP, DPGF (sources)
  │
  └─> Memoire (output)
        ├─> template: Document (type = MODELE_MEMOIRE)
        └─> sections: MemoireSection[]
              ├─> sourceLinks: MemoireSourceLink[] → Document
              └─> requirementLinks: RequirementLink[] → Requirement
```

### Index créés

- `documents` : `projectId`, `documentType`, `createdAt`
- `technical_memos` : `projectId`, `userId`, `status`, `templateDocumentId`, `createdAt`
- `memoire_sections` : `memoireId`, `order`, `status`, `createdAt`
- `memoire_source_links` : `sectionId`, `documentId`
- `requirements` : `projectId`, `documentId`, `category`, `status`

## ⚠️ Important : Mise à jour du code requise

**Après migration et `prisma generate`**, le code devra être mis à jour :

### Changements TypeScript

```typescript
// AVANT
prisma.technicalMemo.findMany()
prisma.technicalMemo.create()
type TechnicalMemo = ...

// APRÈS
prisma.memoire.findMany()
prisma.memoire.create()
type Memoire = ...
```

### Fichiers à modifier

1. `src/services/technical-memo-service.ts`
   - `prisma.technicalMemo` → `prisma.memoire`
   - Types `TechnicalMemo*` → `Memoire*`

2. `src/app/api/memos/**/*.ts`
   - `prisma.technicalMemo` → `prisma.memoire`

3. `src/services/section-ai-service.ts`
   - `prisma.technicalMemo` → `prisma.memoire`

4. `src/lib/utils/validation.ts`
   - `createTechnicalMemoSchema` → `createMemoireSchema`
   - Types associés

## Vérification post-migration

```bash
# Vérifier que le schéma est valide
npx prisma validate

# Vérifier que le client est généré
npx prisma generate

# Ouvrir Prisma Studio pour vérifier visuellement
npx prisma studio
```

