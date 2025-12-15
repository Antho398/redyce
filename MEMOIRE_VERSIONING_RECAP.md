# Récapitulatif - Versioning des Mémoires Techniques

## ✅ Fichiers créés/modifiés

### 1. **Migration Prisma** (nouveau)
- `prisma/migrations/20241216000003_add_memoire_versioning/migration.sql`
- Ajout des champs `versionNumber`, `parentMemoireId`, `isFrozen` à la table `technical_memos`
- Index et foreign key pour le versioning

### 2. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Modèle `Memoire` modifié :
  - `versionNumber` (Int, default 1) : Numéro de version
  - `parentMemoireId` (String?, nullable) : ID du mémoire parent
  - `isFrozen` (Boolean, default false) : Si true, la version est figée
  - Relation `parentMemoire` et `childMemos` pour la chaîne de versions

### 3. **Service Versioning** (`src/services/memoire-version-service.ts`) - NOUVEAU
- ✅ `createNewVersion` : Crée une nouvelle version (clone mémoire + sections, freeze l'ancienne)
- ✅ `getVersionHistory` : Récupère l'historique complet des versions
- ✅ `compareVersions` : Compare deux versions section par section

### 4. **Routes API** (nouvelles)
- `POST /api/memos/[id]/versions` : Crée une nouvelle version
- `GET /api/memos/[id]/versions` : Récupère l'historique des versions
- `GET /api/memos/[id]/compare?versionId=` : Compare deux versions

### 5. **Composants UI** (nouveaux)
- `src/components/memoire/MemoireVersionControl.tsx` : Badge version + boutons "Nouvelle version" et "Comparer"
- `src/components/memoire/MemoireVersionComparison.tsx` : Affichage de la comparaison section par section

### 6. **Guards** (`src/lib/utils/memoire-guards.ts`) - NOUVEAU
- ✅ `ensureMemoireNotFrozen` : Vérifie qu'un mémoire n'est pas figé avant modification

### 7. **API Sections** (`src/app/api/memos/[id]/sections/[sectionId]/route.ts`)
- ✅ Ajout de la vérification `isFrozen` avant toute modification de section

### 8. **UI Éditeur** (`src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx`)
- ✅ Intégration de `MemoireVersionControl` dans le header

## Fonctionnalités implémentées

### Versioning

**Création d'une nouvelle version** :
- Clone le mémoire actuel et toutes ses sections
- Incrémente `versionNumber` (+1)
- Freeze la version précédente (`isFrozen = true`)
- Nouvelle version commence en statut `DRAFT`
- Nouvelle version peut être modifiée (non figée)

**Historique des versions** :
- Récupère toutes les versions d'un mémoire (du plus ancien au plus récent)
- Chaîne de versions basée sur `parentMemoireId`
- Tri par `versionNumber` croissant

**Comparaison de versions** :
- Comparaison section par section
- Indicateur simple : `MODIFIED` ou `UNCHANGED`
- Affichage côte à côte du contenu des deux versions
- Pas de diff caractère par caractère (lisible pour un chargé d'affaires)

### Protection des versions figées

**Vérifications** :
- Impossible de modifier une section d'un mémoire figé
- Impossible de créer une nouvelle version depuis un mémoire figé
- Message d'erreur clair : "Cannot modify a frozen memo version. Please create a new version."

### UI

**Badge de version** :
- Affiche "V1", "V2", "V3", etc. selon `versionNumber`
- Badge "Figé" si `isFrozen = true`

**Boutons** :
- "Nouvelle version" : Crée V2, V3, etc. (désactivé si figé)
- "Comparer" : Compare avec la version précédente (visible si `parentMemoireId` existe)

**Modal de comparaison** :
- Dialogue avec vue côte à côte
- Chaque section affiche :
  - Badge "Inchangé" (vert) ou "Modifié" (orange)
  - Contenu version 1 (gauche)
  - Contenu version 2 (droite)

## Migration

### Commande à exécuter

```bash
# Appliquer la migration
npx prisma migrate deploy

# OU directement avec SQL
psql -d redyce -f prisma/migrations/20241216000003_add_memoire_versioning/migration.sql

# Générer le client Prisma
npx prisma generate
```

### Contenu de la migration

La migration ajoute :
- Colonne `versionNumber` (Int, default 1)
- Colonne `parentMemoireId` (String?, nullable)
- Colonne `isFrozen` (Boolean, default false)
- Index sur `parentMemoireId` et `versionNumber`
- Foreign key vers `technical_memos(id)` pour `parentMemoireId`

**Note** : Si une colonne `version` existait déjà, elle peut être supprimée (commentée dans le SQL pour sécurité).

## Endpoints disponibles

### POST /api/memos/[id]/versions
**Description** : Crée une nouvelle version du mémoire

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "versionNumber": 2,
    "title": "...",
    "sections": [...],
    "parentMemoire": { "id": "...", "versionNumber": 1 }
  }
}
```

**Erreurs** :
- 400 : Mémoire figé
- 403 : Pas d'accès
- 404 : Mémoire non trouvé

### GET /api/memos/[id]/versions
**Description** : Récupère l'historique des versions

**Response** :
```json
{
  "success": true,
  "data": [
    { "id": "...", "versionNumber": 1, ... },
    { "id": "...", "versionNumber": 2, ... },
    ...
  ]
}
```

### GET /api/memos/[id]/compare?versionId=
**Description** : Compare deux versions

**Response** :
```json
{
  "success": true,
  "data": {
    "version1": { "id": "...", "versionNumber": 1, "title": "..." },
    "version2": { "id": "...", "versionNumber": 2, "title": "..." },
    "sections": [
      {
        "order": 1,
        "title": "Section 1",
        "status": "MODIFIED",
        "version1": { "content": "..." },
        "version2": { "content": "..." }
      },
      ...
    ]
  }
}
```

## Checklist de test

### Test 1 : Créer un mémoire et vérifier la version initiale
- [ ] Créer un nouveau mémoire
- [ ] Vérifier que le badge affiche "V1"
- [ ] Vérifier que le bouton "Nouvelle version" est visible
- [ ] Vérifier que le bouton "Comparer" n'est pas visible (pas de parent)

### Test 2 : Créer une nouvelle version (V2)
- [ ] Cliquer sur "Nouvelle version"
- [ ] Vérifier le loader pendant la création
- [ ] Vérifier le toast de succès "Version V2 créée"
- [ ] Vérifier la redirection vers la nouvelle version
- [ ] Vérifier que le badge affiche "V2"
- [ ] Vérifier que le bouton "Comparer" est maintenant visible

### Test 3 : Vérifier que la version précédente est figée
- [ ] Retourner à la version V1 (via l'historique ou URL directe)
- [ ] Vérifier que le badge "Figé" s'affiche
- [ ] Vérifier que le bouton "Nouvelle version" est désactivé
- [ ] Essayer de modifier une section → vérifier l'erreur "Cannot modify frozen memo"

### Test 4 : Comparer deux versions
- [ ] Depuis V2, cliquer sur "Comparer"
- [ ] Vérifier que la modal s'ouvre avec la comparaison
- [ ] Vérifier l'affichage côte à côte :
  - Version 1 à gauche
  - Version 2 à droite
- [ ] Modifier une section dans V2
- [ ] Relancer la comparaison
- [ ] Vérifier que la section modifiée affiche le badge "Modifié"
- [ ] Vérifier que les sections non modifiées affichent "Inchangé"

### Test 5 : Historique des versions
- [ ] Créer V3 depuis V2
- [ ] Vérifier l'historique via l'API `/api/memos/[id]/versions`
- [ ] Vérifier que toutes les versions sont présentes (V1, V2, V3)
- [ ] Vérifier que les versions sont triées par numéro croissant

### Test 6 : Cas limites
- [ ] Essayer de créer une version depuis un mémoire figé → erreur
- [ ] Essayer de comparer avec une version qui n'existe pas → erreur
- [ ] Vérifier que les sections sont bien clonées avec leur contenu

## Points d'attention

- ⚠️ **Renommage de colonne** : Si une colonne `version` existait, elle doit être supprimée (migration commentée pour sécurité)
- ✅ **Clone complet** : Toutes les sections sont clonées avec leur contenu, statut, etc.
- ✅ **Freeze automatique** : La version précédente est automatiquement figée
- ✅ **Protection** : Impossible de modifier une version figée (garde-fou côté API)
- ✅ **Comparaison simple** : Pas de diff caractère par caractère, juste "Inchangé" ou "Modifié"

## Structure de données

### Memoire (Prisma)
```prisma
model Memoire {
  // ... champs existants
  versionNumber   Int      @default(1)
  parentMemoireId String?
  isFrozen        Boolean  @default(false)
  parentMemoire   Memoire? @relation("MemoireVersioning", fields: [parentMemoireId], references: [id])
  childMemos      Memoire[] @relation("MemoireVersioning")
  // ...
}
```

## Workflow utilisateur

1. **Création d'un mémoire** : Version 1 par défaut
2. **Travail sur V1** : Modification des sections, génération IA, etc.
3. **Création V2** : Clique "Nouvelle version" → V1 est figée, V2 créée et active
4. **Travail sur V2** : Modifications, améliorations
5. **Comparaison** : Clique "Comparer" pour voir les différences avec V1
6. **Création V3** : Si besoin, crée V3 depuis V2
7. **Export** : Exporte la version finale (figée ou non)

## Améliorations futures

- [ ] Interface pour voir l'historique complet (liste déroulante ou sidebar)
- [ ] Restauration d'une version précédente (créer une nouvelle version depuis une ancienne)
- [ ] Métadonnées de version (qui a créé, pourquoi, notes)
- [ ] Export comparatif (DOCX avec changements surlignés)
- [ ] Versioning des exports (lié à une version spécifique)

