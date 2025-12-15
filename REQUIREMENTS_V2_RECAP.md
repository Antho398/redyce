# Récapitulatif - Page Exigences V2 (Traçabilité + Liaison sections)

## ✅ Fichiers créés/modifiés

### 1. **Migration Prisma** (nouveau)
- `prisma/migrations/20241216000000_update_requirement_status_priority/migration.sql`
- Met à jour les valeurs de status et priority dans la base de données

### 2. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Modèle Requirement mis à jour :
  - `priority`: LOW, MED, HIGH (au lieu de high/normal/low)
  - `status`: TODO, IN_PROGRESS, COVERED (au lieu de PENDING/VALIDATED/REJECTED)
  - Index ajouté sur `priority`

### 3. **Validation Zod** (`src/lib/utils/validation.ts`)
- ✅ `getRequirementsQuerySchema` : Ajout filtres priority, documentType, q (recherche)
- ✅ `updateRequirementSchema` : Valeurs LOW/MED/HIGH et TODO/IN_PROGRESS/COVERED
- ✅ `linkRequirementToSectionSchema` : Nouveau schéma pour liaison section

### 4. **Service** (`src/services/requirement-service.ts`)
- ✅ `extractRequirementsWithAI` amélioré :
  - Chunking intelligent (30000 chars max : début + fin)
  - Extraction de `sourceQuote` et `sourcePage`
  - Normalisation des valeurs priority (LOW/MED/HIGH)
  - Status par défaut : TODO
  - Instructions IA strictes : ne jamais inventer

### 5. **Routes API** (nouvelles/modifiées)
- `src/app/api/requirements/route.ts` : Filtres améliorés (priority, documentType, recherche)
- `src/app/api/requirements/[id]/link/route.ts` : **NOUVELLE** route pour lier exigence ↔ section

### 6. **Composants UI** (nouveaux)
- `src/components/requirements/RequirementDetailModal.tsx` : Modal de détail avec actions

### 7. **Page UI** (`src/app/(dashboard)/projects/[id]/exigences/page.tsx`)
- ✅ Recherche textuelle
- ✅ Filtres : statut, priorité, catégorie, type de document
- ✅ Colonne "Liée à" dans le tableau
- ✅ Clic sur une exigence → ouvre le modal de détail
- ✅ Intégration du modal avec actions

## Fonctionnalités implémentées

### Extraction d'exigences (IA)

**Prompt IA** :
- Extrait toutes les exigences actionnables : livrables, contraintes, critères, délais, normes, pénalités, formats
- Champs extraits : code, title, description, category, priority, sourceQuote, sourcePage
- **Ne JAMAIS inventer** : si doute → priority LOW + status TODO

**Chunking** :
- Limite : 30000 caractères par document
- Stratégie : début (15000) + fin (15000) si document trop long
- Indication "couverture partielle" à ajouter dans le futur

### Modal de détail

- ✅ **Informations complètes** : code, titre, description, priorité, statut, catégorie
- ✅ **Source document** : nom + type + page + citation exacte (`sourceQuote`)
- ✅ **Sections liées** : liste des sections du mémoire liées
- ✅ **Actions** :
  - Lier à une section (dropdown des sections du mémoire)
  - Marquer comme couverte (status → COVERED)
  - Générer proposition IA (ouvre l'éditeur avec la section liée)

### Tableau de traçabilité

- ✅ Colonnes : Code, Titre, Catégorie, Priorité, Statut, Source, Liée à, Date, Actions
- ✅ Filtres : statut, priorité, catégorie, type de document, recherche textuelle
- ✅ Clic sur une ligne → ouvre le modal de détail

### Liaison exigence ↔ section

- ✅ Route `POST /api/requirements/[id]/link` avec `sectionId`
- ✅ Création de `RequirementLink` avec relevance = 1.0 (manuel)
- ✅ Vérification que section et exigence appartiennent au même projet
- ✅ Affichage dans le tableau et le modal

## Migration Prisma

### Commande à exécuter

```bash
# Appliquer la migration
npx prisma migrate deploy

# OU en développement
npx prisma migrate dev
```

### Contenu de la migration

La migration :
1. Met à jour les valeurs de `status` :
   - PENDING → TODO
   - VALIDATED → COVERED
   - REJECTED → TODO

2. Normalise les valeurs de `priority` :
   - high/important → HIGH
   - normal/medium → MED
   - low → LOW

3. Crée un index sur `priority` (si pas déjà présent)

## Checklist de test manuel

### Test 1 : Extraction d'exigences
- [ ] Uploader des documents AO (AE, RC, CCAP, CCTP, DPGF)
- [ ] S'assurer que les documents sont traités (status = processed)
- [ ] Cliquer "Extraire les exigences"
- [ ] Vérifier que les exigences sont créées avec :
  - Code (si présent dans le document)
  - Titre clair
  - Description détaillée
  - Priorité (LOW/MED/HIGH)
  - SourceQuote (citation exacte)
  - SourcePage (si mentionné)
  - Status = TODO par défaut

### Test 2 : Filtres et recherche
- [ ] Utiliser la recherche textuelle → vérifier que les résultats sont filtrés
- [ ] Filtrer par statut (TODO/IN_PROGRESS/COVERED)
- [ ] Filtrer par priorité (LOW/MED/HIGH)
- [ ] Filtrer par catégorie
- [ ] Filtrer par type de document (AE, RC, etc.)
- [ ] Combiner plusieurs filtres

### Test 3 : Modal de détail
- [ ] Cliquer sur une exigence dans le tableau
- [ ] Vérifier que le modal s'ouvre avec toutes les informations
- [ ] Vérifier l'affichage de la source (document + page + citation)
- [ ] Vérifier les sections liées (si présentes)

### Test 4 : Liaison à une section
- [ ] S'assurer qu'un mémoire existe pour le projet
- [ ] Ouvrir le modal de détail d'une exigence
- [ ] Sélectionner une section dans le dropdown
- [ ] Cliquer "Lier"
- [ ] Vérifier que l'exigence apparaît dans la colonne "Liée à" du tableau
- [ ] Vérifier que la section apparaît dans le modal "Sections liées"

### Test 5 : Marquer comme couverte
- [ ] Ouvrir le modal de détail d'une exigence
- [ ] Cliquer "Marquer comme couverte"
- [ ] Vérifier que le statut passe à "COVERED"
- [ ] Vérifier que le badge "Couverte" apparaît dans le tableau

### Test 6 : Générer proposition IA
- [ ] Lier une exigence à une section
- [ ] Cliquer "Générer une proposition IA"
- [ ] Vérifier que l'éditeur de mémoire s'ouvre dans un nouvel onglet
- [ ] Vérifier que la section liée est sélectionnée
- [ ] (Optionnel) Vérifier que la proposition IA inclut l'exigence dans le contexte

### Test 7 : Cas limites
- [ ] Extraire depuis un document très long → vérifier le chunking
- [ ] Extraire depuis un document sans exigences claires → vérifier que priority = LOW
- [ ] Essayer de lier une exigence à une section d'un autre projet → vérifier l'erreur
- [ ] Rechercher une exigence inexistante → vérifier que le tableau est vide

## Structure de données

### Requirement (Prisma)
```prisma
model Requirement {
  id          String   @id
  projectId   String
  documentId  String?
  code        String?
  title       String
  description String   @db.Text
  category    String?
  priority    String?  // LOW, MED, HIGH
  status      String   @default("TODO") // TODO, IN_PROGRESS, COVERED
  sourcePage  Int?
  sourceQuote String?  @db.Text
  sectionLinks RequirementLink[]
  // ...
}
```

### RequirementLink (Prisma)
```prisma
model RequirementLink {
  id            String   @id
  sectionId     String
  requirementId String
  relevance     Float?   // 1.0 pour liaison manuelle
  section       MemoireSection
  requirement   Requirement
  @@unique([sectionId, requirementId])
}
```

## Points d'attention

- ⚠️ **Chunking** : Documents > 30000 caractères → prise début + fin (couverture partielle)
- ⚠️ **Extraction IA** : Si doute → priority LOW + status TODO (ne jamais inventer)
- ⚠️ **Liaison section** : Vérifie que section et exigence appartiennent au même projet
- ✅ **Migration** : Mettre à jour les données existantes avant déploiement
- ✅ **Recherche textuelle** : Recherche dans title, description, code, sourceQuote

## Commandes

### Migration
```bash
# Appliquer la migration
npx prisma migrate deploy

# OU en développement (crée et applique)
npx prisma migrate dev
```

### Vérification
```bash
# Vérifier l'état de la base
npx prisma studio

# Ou avec SQL
psql -d redyce -c "SELECT status, priority, COUNT(*) FROM requirements GROUP BY status, priority;"
```

## Améliorations futures

- [ ] Ajouter indicateur "couverture partielle" si chunking appliqué
- [ ] Améliorer le chunking (paragraphes/titres au lieu de caractères)
- [ ] Détection automatique de liaison exigence ↔ section (IA)
- [ ] Export des exigences (CSV/Excel)
- [ ] Bulk actions (marquer plusieurs exigences comme couvertes)

