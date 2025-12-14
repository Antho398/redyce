# Plan du mémoire depuis le template client - Implémentation

## Résumé

Implémentation complète de la génération automatique du plan de mémoire (sections/questions) à partir du template client lors de la création d'un mémoire technique.

## Modifications Prisma

### Schema (`prisma/schema.prisma`)
- **Nouveau modèle `MemoireSection`** :
  - `id` (String, cuid)
  - `memoireId` (String) - Relation vers `TechnicalMemo`
  - `title` (String) - Titre de la section
  - `order` (Int) - Ordre d'affichage
  - `question` (String?, @db.Text) - Question si présente dans le template
  - `status` (String, default: "DRAFT") - DRAFT, IN_PROGRESS, COMPLETED
  - `content` (String?, @db.Text) - Contenu de la réponse
  - `sourceRequirementIds` (String[]) - IDs des exigences sources liées
  - `createdAt`, `updatedAt`
  - Contrainte unique : `[memoireId, order]`
  - Index : `memoireId`, `order`, `status`

- **Relation ajoutée** : `TechnicalMemo.sections MemoireSection[]`

### Migration
- Migration créée : `20251214083224_add_memoire_section`
- Appliquée avec succès

## Service

### `technical-memo-service.ts`
- **Modification de `createMemo()`** :
  - Après création du mémoire, parse automatiquement le template
  - Lit le fichier template depuis le storage
  - Utilise `parseDOCXTemplate()` ou `parsePDFTemplate()` selon le type MIME
  - Crée les sections `MemoireSection` en base
  - Fallback : Si aucune section trouvée, crée une section par défaut "Introduction"
  - Gestion d'erreur : Le parsing ne bloque pas la création du mémoire

## Routes API

### GET `/api/memos/[id]/sections`
- Liste toutes les sections d'un mémoire
- Authentification requise (session serveur)
- Vérifie que le mémoire appartient à l'utilisateur
- Retourne les sections triées par `order`

### PUT `/api/memos/[id]/sections/[sectionId]`
- Met à jour une section
- Body : `{ title?, question?, status?, content?, sourceRequirementIds? }`
- Validation Zod avec `updateMemoireSectionSchema`
- Authentification et vérification des permissions

## Validation Zod

### Schémas ajoutés (`src/lib/utils/validation.ts`)
- `updateMemoireSectionSchema` :
  - `title` (string, min 1, optional)
  - `question` (string, optional)
  - `status` (enum: DRAFT, IN_PROGRESS, COMPLETED, optional)
  - `content` (string, optional)
  - `sourceRequirementIds` (array of cuid, optional)

## Page UI

### `/projects/[id]/memoire/[memoireId]/page.tsx`
- **Layout 3 colonnes** :
  - **Gauche** : Liste des sections avec statut
    - Affichage de l'ordre, titre, question (si présente)
    - Badge de statut (DRAFT, IN_PROGRESS, COMPLETED)
    - Sélection visuelle de la section active
    - Scroll vertical si beaucoup de sections
  - **Centre** : Éditeur riche simple
    - Textarea avec placeholder
    - Affichage de la question si présente
    - Compteur de caractères
    - Indicateur "Autosave activé"
    - Badge "Sauvegarde..." pendant l'autosave
  - **Droite** : Panneau IA
    - Bouton "Améliorer" (stub)
    - Bouton "Reformuler" (stub)
    - Bouton "Compléter" (stub)
    - Message "Fonctionnalité à venir"

- **Fonctionnalités** :
  - Autosave avec debounce (2 secondes)
  - Sélection automatique de la première section au chargement
  - Mise à jour du statut automatique (DRAFT → IN_PROGRESS si contenu)
  - Toast de confirmation après sauvegarde

## Hook

### `useDebounce.ts`
- Hook React pour debounce une valeur
- Utilisé pour l'autosave du contenu

## Parsing du template

### Utilisation de `memory-template-parser.ts`
- **DOCX** : Utilise `parseDOCXTemplate()` qui :
  - Extrait le HTML avec mammoth
  - Détecte les titres (h1, h2, h3)
  - Détecte les questions (paragraphes avec "?")
  - Extrait les sections avec ancrage source

- **PDF** : Utilise `parsePDFTemplate()` qui :
  - Parse le texte PDF
  - Détecte les lignes numérotées (1., 1.1., A.)
  - Détecte les lignes en MAJUSCULES
  - Détecte les questions

## Fichiers créés/modifiés

### Créés
1. `src/app/api/memos/[id]/sections/route.ts` - GET liste des sections
2. `src/app/api/memos/[id]/sections/[sectionId]/route.ts` - PUT mise à jour section
3. `src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx` - Page d'édition
4. `src/hooks/useDebounce.ts` - Hook debounce
5. `prisma/migrations/20251214083224_add_memoire_section/migration.sql`
6. `MEMOIRE_PLAN_IMPLEMENTATION.md` (ce fichier)

### Modifiés
1. `prisma/schema.prisma` - Ajout modèle `MemoireSection` et relation
2. `src/services/technical-memo-service.ts` - Parsing automatique dans `createMemo()`
3. `src/lib/utils/validation.ts` - Ajout `updateMemoireSectionSchema`

## Tests manuels

### 1. Création de mémoire avec parsing automatique
1. Créer un nouveau mémoire via `/projects/[id]/memoire/new`
2. Sélectionner un template DOCX ou PDF
3. Vérifier que les sections sont créées automatiquement
4. Vérifier que les sections apparaissent dans la page d'édition

### 2. Édition de section
1. Aller sur `/projects/[id]/memoire/[memoireId]`
2. Sélectionner une section dans la colonne gauche
3. Rédiger du contenu dans l'éditeur
4. Attendre 2 secondes → Vérifier l'autosave (toast + badge)
5. Vérifier que le statut passe à "IN_PROGRESS"

### 3. Navigation entre sections
1. Cliquer sur différentes sections dans la liste
2. Vérifier que le contenu change dans l'éditeur
3. Vérifier que la section active est surlignée

### 4. API Sections
1. GET `/api/memos/[id]/sections` → Doit retourner toutes les sections
2. PUT `/api/memos/[id]/sections/[sectionId]` → Doit mettre à jour la section

## Notes importantes

- ⚠️ **Parsing automatique** : Le parsing se fait lors de la création du mémoire. Si le parsing échoue, le mémoire est quand même créé (sections vides).
- ✅ **Autosave** : Le contenu est sauvegardé automatiquement après 2 secondes d'inactivité
- ✅ **Statut automatique** : Le statut passe à "IN_PROGRESS" dès qu'il y a du contenu
- ✅ **Fallback** : Si aucune section n'est extraite, une section "Introduction" par défaut est créée
- 🔄 **Actions IA** : Les boutons "Améliorer", "Reformuler", "Compléter" sont des stubs pour l'instant

