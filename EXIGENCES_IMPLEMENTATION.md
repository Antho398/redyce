# Module Exigences - Implémentation V1

## Résumé

Implémentation complète du module "Exigences" par projet, permettant d'extraire et gérer les exigences depuis les documents AO (AE, RC, CCAP, CCTP, DPGF).

## Modifications Prisma

### Schema (`prisma/schema.prisma`)
- **Modèle `Requirement` mis à jour** avec les champs suivants :
  - `status` (String, default: "PENDING") : PENDING, VALIDATED, REJECTED
  - `sourcePage` (Int?) : Numéro de page dans le document source
  - `sourceQuote` (String?, @db.Text) : Citation exacte du document source
- Index ajouté sur `status`

### Migration
- Migration créée : `20251214082902_add_requirement_fields`
- Appliquée avec succès

## Routes API

### GET `/api/requirements?projectId=...`
- Liste les exigences d'un projet
- Filtres optionnels : `category`, `status`
- Authentification requise (session serveur)
- Retourne les exigences avec leurs documents sources

### POST `/api/requirements/extract`
- Extrait les exigences depuis tous les documents du projet (types AE, RC, CCAP, CCTP, DPGF)
- Body : `{ projectId: string }`
- Utilise le service `requirementService.extractRequirements()` pour chaque document
- Retourne le nombre d'exigences extraites

### GET `/api/requirements/[id]`
- Détails d'une exigence spécifique
- Inclut le document source et les liens vers les sections mémoire

### PUT `/api/requirements/[id]`
- Met à jour une exigence
- Body : `{ title?, description?, category?, priority?, status?, sourcePage?, sourceQuote? }`
- Validation Zod avec `updateRequirementSchema`

### DELETE `/api/requirements/[id]`
- Supprime une exigence
- Vérifie les permissions avant suppression

## Validation Zod

### Schémas ajoutés (`src/lib/utils/validation.ts`)
- `getRequirementsQuerySchema` : Validation des query params (projectId, category?, status?)
- `updateRequirementSchema` : Validation des mises à jour (tous les champs optionnels)
- `extractRequirementsSchema` : Validation de l'extraction (projectId)

## Service

### `requirement-service.ts`
- **Mise à jour** : `extractRequirements()` crée maintenant les exigences avec `status: 'PENDING'`, `sourcePage`, et `sourceQuote` si fournis par l'IA
- Les méthodes existantes (`getProjectRequirements`, `deleteRequirement`) sont utilisées par les routes API

## Page UI

### `/projects/[id]/exigences/page.tsx`
- **Tableau filtrable** :
  - Colonnes : Code, Titre, Catégorie, Priorité, Statut, Source, Date
  - Filtres : Catégorie (dropdown dynamique), Statut (PENDING/VALIDATED/REJECTED)
- **CTA "Extraire les exigences"** :
  - Appelle `POST /api/requirements/extract`
  - Affiche un loader pendant l'extraction
  - Toast de succès avec le nombre d'exigences extraites
- **Colonne Source** :
  - Lien vers le document source (nom du document)
  - Affichage du numéro de page si disponible
  - Lien cliquable vers `/projects/[id]/documents/[documentId]`
- **Badges** :
  - Statut : Validée (vert), Rejetée (rouge), En attente (outline)
  - Priorité : Haute (rouge), Normale (secondary), Basse (outline)
  - Catégorie : Badge secondary
- **Actions** :
  - Menu dropdown avec "Voir" et "Supprimer"
  - Confirmation avant suppression

## Navigation

### `ProjectTabs.tsx`
- **Onglet "Exigences" ajouté** :
  - Icône : `ListChecks`
  - Route : `/projects/[id]/exigences`
  - Position : Entre "Mémoire technique" et "Exports"

## Fichiers créés/modifiés

### Créés
1. `src/app/api/requirements/route.ts` - GET liste des exigences
2. `src/app/api/requirements/extract/route.ts` - POST extraction
3. `src/app/api/requirements/[id]/route.ts` - GET/PUT/DELETE exigence spécifique
4. `src/app/(dashboard)/projects/[id]/exigences/page.tsx` - Page UI
5. `prisma/migrations/20251214082902_add_requirement_fields/migration.sql`
6. `EXIGENCES_IMPLEMENTATION.md` (ce fichier)

### Modifiés
1. `prisma/schema.prisma` - Ajout champs `status`, `sourcePage`, `sourceQuote` au modèle Requirement
2. `src/lib/utils/validation.ts` - Ajout schémas Zod pour requirements
3. `src/services/requirement-service.ts` - Mise à jour création avec nouveaux champs
4. `src/components/navigation/ProjectTabs.tsx` - Ajout onglet "Exigences"

## Tests manuels

### 1. Extraction d'exigences
1. Aller sur `/projects/[id]/exigences`
2. Cliquer sur "Extraire les exigences"
3. Vérifier que les exigences apparaissent dans le tableau
4. Vérifier que chaque exigence a un document source lié

### 2. Filtres
1. Filtrer par catégorie → Vérifier que seules les exigences de cette catégorie s'affichent
2. Filtrer par statut → Vérifier que seules les exigences de ce statut s'affichent
3. Combiner les filtres → Vérifier que les deux filtres sont appliqués

### 3. Colonne Source
1. Vérifier que le nom du document source est affiché
2. Cliquer sur le lien → Doit rediriger vers la page du document
3. Vérifier l'affichage du numéro de page si disponible

### 4. Actions
1. Cliquer sur le menu "..." d'une exigence
2. "Voir" → Doit afficher les détails (page détail à créer si besoin)
3. "Supprimer" → Confirmation puis suppression

### 5. Navigation
1. Vérifier que l'onglet "Exigences" apparaît dans la navigation du projet
2. Vérifier que l'onglet est actif quand on est sur `/projects/[id]/exigences`

## Notes importantes

- ⚠️ **Documents traités requis** : L'extraction nécessite que les documents soient au statut `processed` avec une analyse de type `extraction` complétée
- ✅ **Types de documents** : Seuls les documents de type AE, RC, CCAP, CCTP, DPGF sont pris en compte pour l'extraction
- ✅ **IA** : L'extraction utilise `gpt-4o-mini` avec un prompt spécialisé pour extraire les exigences
- ✅ **Traçabilité** : Chaque exigence est liée à son document source avec possibilité d'afficher la page et la citation exacte

