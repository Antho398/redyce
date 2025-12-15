# Récapitulatif - Export DOCX du Mémoire Technique

## ✅ Fichiers créés/modifiés

### 1. **Migration Prisma** (nouveau)
- `prisma/migrations/20241216000001_add_memoire_export/migration.sql`
- Table `memoire_exports` avec relations vers `Memoire` et `Project`

### 2. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Modèle `MemoireExport` ajouté :
  - `id`, `memoireId`, `projectId`
  - `type` (DOCX par défaut)
  - `status` (PENDING, COMPLETED, ERROR)
  - `filePath`, `fileName`, `error`
  - `metadata` (JSON pour sections manquantes, etc.)

### 3. **Service** (`src/services/memoire-export-service.ts`) - NOUVEAU
- ✅ `generateDOCXExport` : Génère un DOCX à partir du mémoire
- ✅ `buildDOCXDocument` : Construit le document DOCX avec la librairie `docx`
- ✅ `getProjectExports` : Liste les exports d'un projet
- ✅ `getExportById` : Récupère un export par ID

### 4. **Routes API** (nouvelles)
- `src/app/api/memos/[id]/export-docx/route.ts` : POST pour générer un export
- `src/app/api/exports/[id]/download/route.ts` : GET pour télécharger un export
- `src/app/api/exports/route.ts` : GET pour lister les exports d'un projet

### 5. **Page UI** (`src/app/(dashboard)/projects/[id]/exports/page.tsx`)
- ✅ Liste des exports avec statuts
- ✅ Bouton "Générer DOCX" avec état loading
- ✅ Bouton télécharger pour chaque export
- ✅ Avertissement si aucun mémoire trouvé

## Fonctionnalités implémentées

### Génération DOCX

**Stratégie V1** :
- Utilise la librairie `docx` pour créer un document propre
- Structure :
  1. En-tête : Nom du projet + titre mémoire + date + nom entreprise (placeholder)
  2. Avertissement "EXPORT PARTIEL" si sections vides (liste des sections)
  3. Sections dans l'ordre du template :
     - Titre de section (Heading 2)
     - Question (en italique/gras si présente)
     - Contenu de la réponse (paragraphes séparés par retours à la ligne)
     - "[Section non complétée]" si vide

**Format** :
- Titre du projet : Heading Title (centré)
- Titre mémoire : Heading 1 (centré)
- Date : Texte en gras
- Nom entreprise : Texte en italique (placeholder)
- Sections : Heading 2
- Questions : Texte en gras + italique
- Contenu : Paragraphes normaux

### Stockage

- ✅ Fichier sauvegardé via `fileStorage.saveFile`
- ✅ Chemin stocké dans `MemoireExport.filePath`
- ✅ Métadonnées JSON avec :
  - Nombre de sections totales
  - Nombre de sections vides
  - Liste des sections vides (id, title, order)
  - Date d'export
  - Nom du projet
  - Titre du mémoire

### Gestion des erreurs

- ✅ Statut PENDING pendant la génération
- ✅ Statut COMPLETED si succès
- ✅ Statut ERROR si échec (avec message d'erreur)
- ✅ Vérification des autorisations (user doit posséder le projet)

### UX

- ✅ Bouton "Générer DOCX" avec loader
- ✅ Toast de succès avec avertissement si sections vides
- ✅ Liste des exports avec statuts visuels
- ✅ Bouton télécharger uniquement si status = COMPLETED
- ✅ Empty state si aucun export

## Migration

### Commande à exécuter

```bash
# Appliquer la migration
npx prisma migrate deploy

# OU en développement
psql -d redyce -f prisma/migrations/20241216000001_add_memoire_export/migration.sql

# Générer le client Prisma
npx prisma generate
```

### Contenu de la migration

La migration crée :
- Table `memoire_exports` avec tous les champs nécessaires
- Index sur `memoireId`, `projectId`, `status`, `createdAt`
- Foreign keys vers `technical_memos` et `projects` avec CASCADE

## Installation

```bash
npm install docx
```

Déjà fait ✅

## Checklist de test manuel

### Test 1 : Créer un projet et uploader template
- [ ] Créer un nouveau projet
- [ ] Uploader un document de type `MODELE_MEMOIRE` (DOCX ou PDF)
- [ ] Vérifier que le document est traité (status = processed)

### Test 2 : Créer un mémoire et remplir des sections
- [ ] Aller sur `/projects/[id]/memoire`
- [ ] Cliquer "Nouveau mémoire"
- [ ] Sélectionner le template et créer le mémoire
- [ ] Ouvrir l'éditeur
- [ ] Remplir au moins 2 sections avec du contenu
- [ ] Laisser 1-2 sections vides

### Test 3 : Générer un export DOCX
- [ ] Aller sur `/projects/[id]/exports`
- [ ] Cliquer "Générer DOCX"
- [ ] Vérifier le loader pendant la génération
- [ ] Vérifier le toast de succès
- [ ] Vérifier que l'export apparaît dans la liste avec statut "Disponible"

### Test 4 : Télécharger l'export
- [ ] Cliquer sur le bouton télécharger (icône Download)
- [ ] Vérifier que le fichier DOCX se télécharge
- [ ] Ouvrir le fichier DOCX
- [ ] Vérifier :
  - En-tête avec nom projet + date
  - Avertissement "EXPORT PARTIEL" si sections vides
  - Liste des sections vides
  - Sections complétées avec titre + question + contenu
  - Sections vides avec "[Section non complétée]"

### Test 5 : Vérifier les métadonnées
- [ ] Vérifier dans la DB que `MemoireExport.metadata` contient :
  - `sectionsCount`
  - `emptySectionsCount`
  - `emptySections` (array)
  - `exportDate`
  - `projectName`
  - `memoireTitle`

### Test 6 : Cas limites
- [ ] Essayer de générer un export sans mémoire → vérifier l'erreur
- [ ] Essayer de télécharger un export en PENDING → vérifier que le bouton est désactivé
- [ ] Essayer de télécharger un export avec ERROR → vérifier que le fichier n'existe pas

## Structure du document DOCX généré

```
[EN-TÊTE]
  - Nom du projet (Heading Title, centré)
  - Mémoire technique - [Titre] (Heading 1, centré)
  - Date : [Date] (gras)
  - [Nom de l'entreprise] (italique)

[Avertissement si sections vides]
  - ⚠️ EXPORT PARTIEL (Heading 2)
  - Liste des sections non complétées

[SECTIONS]
  Pour chaque section (ordre) :
    - Section N : [Titre] (Heading 2)
    - [Question] (gras + italique, si présente)
    - [Contenu] (paragraphes normaux)
    - OU "[Section non complétée]" (italique, gris) si vide
```

## Points d'attention

- ⚠️ **Librairie docx** : Utilise `docx` de Microsoft (fiable, mais V1 simple)
- ⚠️ **Styles du template** : Pour l'instant, styles basiques (headings). Le template client n'est pas réutilisé directement.
- ⚠️ **Sections vides** : Affiche "[Section non complétée]" en italique/gris
- ✅ **Métadonnées** : Toutes les infos (sections vides, dates, etc.) sont stockées dans `metadata`
- ✅ **Sécurité** : Vérifie toujours que l'utilisateur possède le projet

## Améliorations futures

- [ ] Réutiliser les styles du template DOCX client (via mammoth/docx-templater)
- [ ] Support PDF en sortie (via pdfkit ou similaire)
- [ ] Prévisualisation avant export
- [ ] Options d'export (inclure/exclure sections vides, format de date, etc.)
- [ ] Export avec table des matières automatique
- [ ] Export avec numérotation des pages

## Commandes

### Migration
```bash
# Appliquer la migration
npx prisma migrate deploy

# OU directement avec SQL
psql -d redyce -f prisma/migrations/20241216000001_add_memoire_export/migration.sql

# Générer le client Prisma
npx prisma generate
```

### Test
```bash
# Démarrer le serveur
npm run dev

# Tester le flow :
# 1. Créer projet
# 2. Uploader template MODELE_MEMOIRE
# 3. Créer mémoire
# 4. Remplir 2 sections
# 5. Aller sur /projects/[id]/exports
# 6. Générer DOCX
# 7. Télécharger et vérifier
```

