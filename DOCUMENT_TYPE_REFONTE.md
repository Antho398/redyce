# Refonte gestion Documents - Type obligatoire

## Résumé

Refonte complète de la gestion des documents pour imposer un type de document obligatoire lors de l'upload, conformément au PRD Redyce.

## Modifications Prisma

### Schema (`prisma/schema.prisma`)
- Ajout d'un enum `DocumentType` avec les valeurs :
  - `AE` (Avant-Projet)
  - `RC` (Règlement de Consultation)
  - `CCAP` (Cahier des Clauses Administratives Particulières)
  - `CCTP` (Cahier des Clauses Techniques Particulières)
  - `DPGF` (Dossier de Prescription Générale des Fournitures)
  - `TEMPLATE_MEMOIRE` (Template mémoire - obligatoire pour génération)
  - `AUTRE` (Autre)
- Le champ `documentType` dans le modèle `Document` est maintenant obligatoire (non nullable)

### Migration
- Migration créée : `20251214082046_add_document_type_enum`
- Appliquée avec succès

## Modifications Backend

### Validation Zod (`src/lib/utils/validation.ts`)
- `documentUploadSchema` : `documentType` est maintenant obligatoire (non optionnel)
- Utilise `z.enum(['AE', 'RC', 'CCAP', 'CCTP', 'DPGF', 'TEMPLATE_MEMOIRE', 'AUTRE'])`

### API Upload (`src/app/api/documents/upload/route.ts`)
- Validation Zod ajoutée pour `projectId` et `documentType`
- Retourne une erreur 400 si le type n'est pas fourni ou invalide
- Utilise `documentUploadSchema` au lieu de `uploadDocumentSchema`

### Service Document (`src/services/document-service.ts`)
- `createDocument` : `documentType` est maintenant obligatoire (non optionnel)

### Constantes (`src/config/constants.ts`)
- `DOCUMENT_TYPES` mis à jour avec les nouveaux types :
  - `AE`, `RC`, `CCAP`, `CCTP`, `DPGF`, `TEMPLATE_MEMOIRE`, `AUTRE`
  - Suppression de `OTHER` (remplacé par `AUTRE`)

## Modifications Frontend

### Composant DocumentUpload (`src/components/documents/DocumentUpload.tsx`)
- **Type obligatoire** : Le sélecteur de type est maintenant en haut, avec un astérisque rouge
- Utilise le composant `Select` de Radix UI au lieu d'un `<select>` HTML
- Zone de drop désactivée si aucun type n'est sélectionné
- Message d'erreur si upload tenté sans type
- Validation côté client avant upload

### Page Documents (`src/app/(dashboard)/projects/[id]/documents/page.tsx`)
- Colonne "Type" ajoutée dans le tableau
- **Badge "Template mémoire"** : Badge violet affiché sur les documents de type `TEMPLATE_MEMOIRE`
- Affichage du type de document dans une colonne dédiée

### Page Création Mémoire (`src/app/(dashboard)/projects/[id]/memoire/new/page.tsx`)
- **Warning amélioré** : Affiche un warning clair si aucun template `TEMPLATE_MEMOIRE` n'est disponible
- CTA "Uploader un template" qui redirige vers la page Documents
- Filtre uniquement les documents de type `TEMPLATE_MEMOIRE` (plus de fallback sur `MODELE_MEMOIRE`)

## Fichiers créés/modifiés

### Créés
- `prisma/migrations/20251214082046_add_document_type_enum/migration.sql`

### Modifiés
1. `prisma/schema.prisma` - Ajout enum DocumentType
2. `src/lib/utils/validation.ts` - documentType obligatoire
3. `src/app/api/documents/upload/route.ts` - Validation Zod
4. `src/services/document-service.ts` - documentType obligatoire
5. `src/config/constants.ts` - Nouveaux types
6. `src/components/documents/DocumentUpload.tsx` - Type obligatoire + UI
7. `src/app/(dashboard)/projects/[id]/documents/page.tsx` - Badge template + colonne type
8. `src/app/(dashboard)/projects/[id]/memoire/new/page.tsx` - Warning amélioré

## Tests manuels

### 1. Upload avec type obligatoire
1. Aller sur `/projects/[id]/documents`
2. Vérifier que le sélecteur de type est en haut avec un astérisque rouge
3. Essayer d'uploader sans sélectionner de type → Zone de drop désactivée
4. Sélectionner un type (ex: `TEMPLATE_MEMOIRE`)
5. Uploader un fichier → Doit fonctionner

### 2. Badge Template mémoire
1. Uploader un document de type `TEMPLATE_MEMOIRE`
2. Vérifier dans la liste des documents :
   - Badge violet "Template mémoire" à côté du nom
   - Type affiché dans la colonne "Type"

### 3. Warning création mémoire
1. Aller sur `/projects/[id]/memoire/new`
2. Si aucun template `TEMPLATE_MEMOIRE` :
   - Warning jaune affiché
   - CTA "Uploader un template" visible
   - Cliquer → Redirige vers `/projects/[id]/documents`

### 4. Validation API
1. Tester l'upload sans `documentType` dans le FormData
2. Doit retourner une erreur 400 avec message de validation

## Notes importantes

- ⚠️ **Migration nécessaire** : Les documents existants sans type devront être mis à jour manuellement ou via un script de migration
- ✅ **Rétrocompatibilité** : Les anciens documents sans type affichent "—" dans la colonne Type
- ✅ **Template obligatoire** : Le type `TEMPLATE_MEMOIRE` est requis pour créer un mémoire technique

