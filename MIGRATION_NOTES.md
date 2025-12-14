# Migration Notes - Système Mémoire Technique avec Template Client

## Vue d'ensemble

Cette migration transforme Redyce d'un système de génération de livrables (DPGF, CCTP) en un système de génération de **mémoires techniques** basés sur un **template client obligatoire**.

### Changements majeurs

1. **DPGF et CCTP deviennent des SOURCES** (inputs) au lieu de livrables finaux
2. **Le MÉMOIRE TECHNIQUE devient le livrable principal**, basé sur un template client
3. **Nouveau workflow** : Upload template → Extraction sections → Réponses par section → Export
4. **Extraction d'exigences** depuis les documents AO (Appel d'Offres)
5. **Mapping exigences → sections** pour guider la génération

## Modèles Prisma ajoutés

### MemoryTemplate
- Template mémoire client uploadé par projet
- Un seul template par projet (relation 1-1 avec Project)
- Statuts: `uploaded`, `parsing`, `parsed`, `error`

### MemorySection
- Section extraite du template (question/rubrique)
- Support de hiérarchie (sections parentes/enfants)
- Ordre d'affichage
- Statuts: `pending`, `generating`, `completed`

### MemoryAnswer
- Réponse générée pour une section
- Une réponse par section (relation 1-1)
- Citations vers les documents sources

### Requirement
- Exigence extraite des documents AO
- Catégories et priorités
- Liens vers les sections mémoire via RequirementLink

### RequirementLink
- Lien entre une exigence et une section
- Score de pertinence (0-1)

### Citation
- Citation d'un document dans une réponse
- Extrait et numéro de page

## Migration Prisma

### Exécuter la migration

```bash
npx prisma migrate dev
```

Le fichier de migration se trouve dans `prisma/migrations/20241214000000_add_memory_template_system/migration.sql`

### Vérifier la migration

```bash
npx prisma studio
```

## Services créés

### memory-template-service.ts
- `createTemplate()` : Crée un template depuis un document
- `parseTemplate()` : Parse le template et extrait les sections
- `getProjectTemplate()` : Récupère le template d'un projet
- `deleteTemplate()` : Supprime un template

### memory-section-service.ts
- `getProjectSections()` : Récupère toutes les sections d'un projet
- `generateSectionAnswer()` : Génère une réponse pour une section
- `updateAnswer()` : Met à jour une réponse
- `generateAllAnswers()` : Génère toutes les réponses d'un projet

### requirement-service.ts
- `extractRequirements()` : Extrait les exigences d'un document
- `getProjectRequirements()` : Récupère les exigences d'un projet
- `mapRequirementsToSections()` : Mappe les exigences aux sections
- `deleteRequirement()` : Supprime une exigence

## Routes API créées

### Mémoire Template
- `POST /api/memoire/template/parse` : Parse un template et extrait les sections

### Sections Mémoire
- `GET /api/memoire/sections?projectId=xxx` : Liste les sections d'un projet
- `POST /api/memoire/sections/[id]/generate` : Génère une réponse pour une section
- `POST /api/memoire/sections/generate-all` : Génère toutes les réponses

### Export
- `POST /api/memoire/export` : Exporte le mémoire en DOCX/PDF (TODO: implémentation complète)

### Exigences
- `POST /api/analysis/requirements/extract` : Extrait les exigences d'un document
- `POST /api/analysis/requirements/map` : Mappe les exigences aux sections

## Validation Zod

Les schémas de validation ont été ajoutés dans `src/lib/utils/validation.ts` :

- `parseMemoryTemplateSchema`
- `generateSectionAnswerSchema`
- `updateSectionAnswerSchema`
- `extractRequirementsSchema`
- `mapRequirementsSchema`
- `exportMemorySchema`

## Workflow utilisateur

### 1. Upload du template mémoire

L'utilisateur doit uploader un document "Mémoire client" (template) dans son projet. Ce document doit être marqué avec `documentType="MEMORY_TEMPLATE"` ou identifié comme template.

**À implémenter** : Validation lors de l'upload pour s'assurer qu'un template est obligatoire.

### 2. Parsing du template

Une fois le template uploadé, l'utilisateur lance le parsing via :

```typescript
POST /api/memoire/template/parse
{
  "templateId": "template_id"
}
```

Cela extrait automatiquement les sections/questions du template en utilisant l'IA.

### 3. Extraction des exigences (optionnel)

Si l'utilisateur a des documents AO (Appel d'Offres), il peut extraire les exigences :

```typescript
POST /api/analysis/requirements/extract
{
  "documentId": "document_id"
}
```

### 4. Mapping des exigences (optionnel)

Mapper les exigences aux sections :

```typescript
POST /api/analysis/requirements/map
{
  "projectId": "project_id"
}
```

### 5. Génération des réponses

#### Par section

```typescript
POST /api/memoire/sections/[sectionId]/generate
{
  "userContext": "Contexte optionnel",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

#### Toutes les sections

```typescript
POST /api/memoire/sections/generate-all
{
  "projectId": "project_id"
}
```

### 6. Export

```typescript
POST /api/memoire/export
{
  "projectId": "project_id",
  "format": "docx" // ou "pdf"
}
```

## Transformations à faire

### Pages DPGF/CCTP

Les pages `/projects/[id]/dpgf` et `/projects/[id]/cctp` doivent être transformées en **vues de données techniques** (sources) au lieu de pages de génération.

**Changements** :
- Retirer les boutons de génération
- Afficher les DPGF/CCTP comme des données sources
- Pas de wording "générer", mais plutôt "visualiser", "consulter"

### Page Mémoire

Créer la page `/projects/[id]/memoire` avec :
- **Left panel** : Liste des sections
- **Center panel** : Éditeur de réponse pour la section sélectionnée
- **Right panel** : Assistant IA contextuel
- **Actions** : Générer section / Générer tout / Export DOCX

## Tests recommandés

### 1. Migration Prisma

```bash
# Vérifier que la migration fonctionne
npx prisma migrate dev
npx prisma studio
```

### 2. Upload template

1. Créer un projet
2. Uploader un document avec `documentType="MEMORY_TEMPLATE"`
3. Vérifier que le template est créé dans la base

### 3. Parsing template

1. Lancer le parsing via l'API
2. Vérifier que les sections sont extraites
3. Vérifier les sections dans Prisma Studio

### 4. Génération de réponses

1. Générer une réponse pour une section
2. Vérifier que la réponse est créée
3. Vérifier les citations si présentes

### 5. Extraction exigences

1. Uploader un document AO
2. Analyser le document
3. Extraire les exigences
4. Vérifier dans Prisma Studio

### 6. Mapping exigences

1. Avoir des sections et des exigences
2. Lancer le mapping
3. Vérifier les liens RequirementLink créés

## Points d'attention

### 1. Obligation du template

Le template mémoire doit être **obligatoire** pour chaque projet. À implémenter :
- Validation lors de la création de projet
- Message d'erreur si pas de template lors de la génération
- Workflow guidé pour uploader le template

### 2. Performance

- La génération de toutes les réponses peut être longue → envisager une queue/tâche en arrière-plan
- Le mapping des exigences peut être coûteux en tokens → optimiser les prompts

### 3. Export DOCX

L'export DOCX n'est pas encore implémenté. Il faudra :
- Utiliser une bibliothèque comme `docx` (npm)
- Générer le document avec toutes les sections et réponses
- Gérer le téléchargement du fichier

### 4. Citations

Les citations ne sont pas encore extraites automatiquement. À implémenter :
- Extraction des citations depuis les réponses IA
- Lien avec les documents sources
- Affichage dans l'UI

## Prochaines étapes

1. ✅ Schéma Prisma et migration
2. ✅ Services backend
3. ✅ Routes API
4. ⏳ UI page mémoire avec split view
5. ⏳ Transformation pages DPGF/CCTP
6. ⏳ Validation template obligatoire
7. ⏳ Export DOCX complet
8. ⏳ Extraction automatique des citations

## Fichiers modifiés/créés

### Nouveaux fichiers
- `src/services/memory-template-service.ts`
- `src/services/memory-section-service.ts`
- `src/services/requirement-service.ts`
- `src/app/api/memoire/template/parse/route.ts`
- `src/app/api/memoire/sections/route.ts`
- `src/app/api/memoire/sections/[id]/generate/route.ts`
- `src/app/api/memoire/sections/generate-all/route.ts`
- `src/app/api/memoire/export/route.ts`
- `src/app/api/analysis/requirements/extract/route.ts`
- `src/app/api/analysis/requirements/map/route.ts`
- `prisma/migrations/20241214000000_add_memory_template_system/migration.sql`

### Fichiers modifiés
- `prisma/schema.prisma` (ajout des nouveaux modèles)
- `src/lib/utils/validation.ts` (ajout des schémas Zod)

## Notes de développement

### Modèle IA utilisé

Par défaut, les services utilisent `gpt-4o-mini` pour réduire les coûts. Cela peut être personnalisé via les paramètres des routes API.

### Gestion des erreurs

Tous les services gèrent les erreurs et mettent à jour les statuts appropriés dans la base de données.

### Tracking usage

Tous les appels IA sont trackés via `usageTracker` pour le monitoring des coûts.

## Questions/Résolutions

### Comment identifier un document comme template ?

Pour l'instant, le template est identifié via un `MemoryTemplate` créé manuellement. À améliorer :
- Auto-détection lors de l'upload
- Validation du format (DOCX/PDF requis)
- Workflow guidé

### Comment gérer les templates multiples ?

Un projet ne peut avoir qu'un seul template actif. Pour changer de template, il faut supprimer l'ancien et en créer un nouveau.

### Comment gérer les réponses longues ?

Les réponses sont stockées en `TEXT` dans Prisma, ce qui permet jusqu'à plusieurs MB de texte. Pour des réponses très longues, envisager un stockage externe.

