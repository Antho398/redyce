# Implémentation - Système Mémoire Technique avec Template Client

## Vue d'ensemble

Redyce V1 est désormais centré sur la génération de **mémoires techniques** basés sur un **template client obligatoire**. DPGF et CCTP sont des **documents sources** (inputs), pas des livrables finaux.

## Modèles Prisma (Conformes aux spécifications)

### MemoryTemplate
- `id`, `projectId` (unique, obligatoire)
- `documentId` (document source)
- `name` (nom du template)
- `status`: `UPLOADED` | `PARSING` | `PARSED` | `FAILED`
- `parsedAt`, `metaJson` (nbSections, warnings, etc.)

**Contrainte**: 1 project = 1 template obligatoire (unique projectId)

### MemorySection
- `id`, `projectId`, `templateId`
- `order` (ordre d'affichage)
- `title` (titre de la section)
- `path` (chemin hiérarchique, ex: "1.2.3")
- `sourceAnchorJson` (ancrage source dans le document)
- `required` (bool, default: true)

**Contrainte**: MemorySection unique (projectId, order)

### MemoryAnswer
- `id`, `projectId`, `sectionId` (unique)
- `contentHtml` (contenu en HTML)
- `status`: `DRAFT` | `READY` | `REVIEWED`

**Contrainte**: MemoryAnswer unique (sectionId)

### MemoryExport
- `id`, `projectId`, `templateId`
- `version`, `docxPath`
- `createdAt`

## Routes API implémentées

### Template
- `POST /api/memoire/template`
  - Body: `{ projectId, documentId, name? }`
  - Crée ou remplace le template (purge sections/answers si existe)

- `POST /api/memoire/template/parse`
  - Body: `{ projectId }`
  - Parse le template et extrait les sections
  - Crée MemorySection + MemoryAnswer (vides)
  - Status → `PARSED` / `FAILED`

- `GET /api/memoire/template?projectId=xxx`
  - Récupère le template avec sections et answers

### Sections
- `GET /api/memoire/sections?projectId=xxx`
  - Liste sections + statut answer (et preview)

- `GET /api/memoire/sections/[id]`
  - Détail section + answer

### Réponses
- `PUT /api/memoire/answers/[sectionId]`
  - Body: `{ contentHtml, status? }`
  - Autosave des réponses

- `POST /api/memoire/sections/[id]/generate`
  - Stub: renvoie un texte placeholder (câblé proprement)

### Export
- `POST /api/memoire/export`
  - Body: `{ projectId, format }`
  - TODO: Implémentation complète

## Parsing du template

### Stratégie V1 (robuste, simple)

#### DOCX (via mammoth)
1. Extraction HTML avec `mammoth.convertToHtml()`
2. Parser les titres: `<h1>`, `<h2>`, `<h3>`
3. OU parser les paragraphes qui ressemblent à des questions:
   - Finissant par "?"
   - Contenant "Décrivez/Précisez/Indiquez/Expliquez"
4. Conserver l'ordre d'apparition
5. Générer `path` hiérarchique depuis les niveaux de titres

#### PDF
1. Extraction texte brut (via `parsePDF`)
2. Détecter les lignes:
   - En MAJUSCULES (titres probables)
   - Numérotées (1., 1.1., A., etc.)
   - Questions avec "?"
3. Générer `path` depuis la numérotation

### Output
Array de `{ order, title, path, required=true, sourceAnchorJson }`

Le `metaJson` du template stocke:
- `nbSections`: nombre de sections extraites
- `warnings`: array de warnings éventuels

## UI implémentée

### Page `/projects/[id]/memoire`

**Layout 3 colonnes (compact)**:

- **Gauche**: Liste sections (scroll)
  - Ordre/path affiché
  - Badge statut (Vide, Brouillon, Prêt, Validé)
  - Sélection active highlight

- **Centre**: Éditeur
  - Textarea simple (convertit texte ↔ HTML)
  - Autosave après 2 secondes d'inactivité
  - Indicateur "Sauvegarde..."
  - Titre section + badge "Obligatoire"

- **Droite**: Panneau actions
  - Bouton "Générer" (stub)
  - Bouton "Exporter DOCX" (disabled)
  - Placeholder "Sources" (à venir)

### Page `/projects/[id]/documents`

**Gestion template obligatoire**:

- Si aucun template `PARSED`:
  - Bloc jaune "Template mémoire requis"
  - Liste des documents PDF/DOCX avec bouton "Utiliser comme template"
  - Upload de documents normal

- Si template `UPLOADED`:
  - Bloc avec bouton "Parser le template"

- Si template `PARSED`:
  - Bloc vert avec compteur de sections
  - CTA "Aller au Mémoire"

- Si template `FAILED`:
  - Bloc rouge avec message d'erreur

## Validation Zod

Tous les schémas dans `src/lib/utils/validation.ts`:

- `parseMemoryTemplateSchema`: `{ projectId }`
- `createMemoryTemplateSchema`: `{ projectId, documentId, name? }`
- `updateSectionAnswerSchema`: `{ contentHtml, status? }`

## Workflow utilisateur

1. **Créer projet** → Aller sur `/projects/[id]/documents`
2. **Uploader template** → Sélectionner document comme template
3. **Parser template** → Cliquer "Parser le template"
4. **Redirection** → Vers `/projects/[id]/memoire`
5. **Éditer sections** → Sélectionner section → Éditer → Autosave
6. **Générer section** → Bouton "Générer" (stub pour l'instant)
7. **Exporter** → Bouton "Exporter DOCX" (à implémenter)

## Fichiers créés/modifiés

### Nouveaux fichiers
- `src/services/memory-template-parser.ts` - Parsing DOCX/PDF
- `src/services/memory-template-service.ts` - Service template (mise à jour)
- `src/services/memory-section-service.ts` - Service sections/réponses (mise à jour)
- `src/app/api/memoire/template/route.ts` - CRUD template
- `src/app/api/memoire/template/parse/route.ts` - Parse template
- `src/app/api/memoire/sections/route.ts` - Liste sections
- `src/app/api/memoire/sections/[id]/route.ts` - Détail section
- `src/app/api/memoire/answers/[sectionId]/route.ts` - Update answer
- `src/app/api/memoire/sections/[id]/generate/route.ts` - Générer réponse (stub)
- `src/app/api/memoire/export/route.ts` - Export (TODO)
- `src/app/(dashboard)/projects/[id]/memoire/page.tsx` - Page mémoire 3 colonnes

### Fichiers modifiés
- `prisma/schema.prisma` - Nouveaux modèles selon spécifications
- `src/app/(dashboard)/projects/[id]/documents/page.tsx` - Gestion template obligatoire
- `src/lib/utils/validation.ts` - Schémas Zod

## Migration Prisma

### Créer la migration

```bash
npx prisma migrate dev --name memory_template_system
```

### Vérifier

```bash
npx prisma studio
```

## Tests recommandés

### 1. Création template
```bash
POST /api/memoire/template
{
  "projectId": "...",
  "documentId": "..."
}
```

### 2. Parsing template
```bash
POST /api/memoire/template/parse
{
  "projectId": "..."
}
```

### 3. Liste sections
```bash
GET /api/memoire/sections?projectId=...
```

### 4. Update answer
```bash
PUT /api/memoire/answers/[sectionId]
{
  "contentHtml": "<p>Ma réponse</p>",
  "status": "DRAFT"
}
```

## Points d'attention

1. **Template obligatoire**: Un projet DOIT avoir un template PARSED pour fonctionner
2. **Autosave**: Sauvegarde automatique après 2 secondes (à ajuster si nécessaire)
3. **Conversion HTML**: Les réponses sont stockées en HTML, affichées en texte dans le textarea
4. **Parsing robuste**: La stratégie DOCX/PDF est basique mais fonctionnelle pour V1
5. **Export DOCX**: Non implémenté, à faire dans une prochaine itération

## Prochaines étapes

1. ✅ Schéma Prisma conforme
2. ✅ Parsing template DOCX/PDF
3. ✅ Routes API complètes
4. ✅ UI 3 colonnes compacte
5. ⏳ Export DOCX complet
6. ⏳ Génération IA réelle (actuellement stub)
7. ⏳ Gestion des sources (DPGF/CCTP) dans le contexte

## Notes techniques

- **Mammoth** utilisé pour DOCX (déjà installé)
- **Parse PDF** réutilise le parser existant
- **Auto-save** avec debounce (2 secondes)
- **Design System V1** respecté (compact, professionnel)
- **Pas de breaking changes** sur l'existant (DPGF/CCTP toujours fonctionnels)

