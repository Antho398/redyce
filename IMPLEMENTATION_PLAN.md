# Plan d'Implémentation Redyce - Application Complète

## ✅ Phase 1: Fondations - TERMINÉE

- [x] Analyse du projet existant
- [x] Identification des gaps
- [x] Ajout dépendances (mammoth, sharp, tesseract.js)
- [x] Schéma Prisma mis à jour avec DPGFStructured et CCTPGenerated

## 🚧 Phase 2: Parsers Multi-Format - EN COURS

### À créer:

1. **Parser DOCX** (`src/lib/documents/parser/docx-parser.ts`)
   - Utiliser mammoth pour extraction texte
   - Conserver structure et formatage
   - Extraire images intégrées

2. **Parser Images avec OCR** (`src/lib/documents/parser/image-parser.ts`)
   - Utiliser tesseract.js pour OCR
   - Support JPG, PNG, GIF
   - Optimisation avec sharp

3. **Unifier interface parsers** (`src/lib/documents/parser/unified-parser.ts`)
   - Interface commune pour tous les parsers
   - Détection automatique du type
   - Router vers le bon parser

## 📋 Phase 3: Module IA Structuré (`/src/ia`)

### Structure à créer:

```
src/ia/
├── client.ts                 # Client IA centralisé (copier depuis lib/ai)
├── pipelines/
│   ├── dpgf-extraction-pipeline.ts  # Pipeline extraction DPGF
│   ├── cctp-generation-pipeline.ts  # Pipeline génération CCTP
│   └── document-analysis-pipeline.ts
├── prompts/
│   ├── dpgf-extraction.ts    # Prompts pour extraction DPGF
│   ├── cctp-generation.ts    # Prompts pour génération CCTP
│   └── document-analysis.ts  # Prompts analyse documents
└── utils/
    ├── structurizer.ts       # Utilitaires structuration
    └── validator.ts          # Validation résultats IA
```

## 🔧 Phase 4: Services Métier

### Services à créer/améliorer:

1. **DPGFService** (`src/services/dpgf-service.ts`)
   - Extraction DPGF structuré
   - Validation et normalisation
   - CRUD DPGF

2. **CCTPService** (`src/services/cctp-service.ts`)
   - Génération CCTP depuis DPGF
   - Gestion versions
   - Export PDF/DOCX

3. **Améliorer DocumentService**
   - Support multi-format
   - Gestion OCR
   - Workflow complet upload -> parse -> analyse

## 🌐 Phase 5: Routes API

### Routes à créer:

1. **`/api/documents/extract-dpgf`** (POST)
   - Extraction DPGF depuis document
   - Retourne DPGFStructured

2. **`/api/dpgf`** (GET, POST, PUT, DELETE)
   - CRUD complet DPGF

3. **`/api/dpgf/[id]`** (GET, PUT, DELETE)
   - Opérations sur un DPGF spécifique

4. **`/api/cctp/generate`** (POST)
   - Génération CCTP depuis DPGF

5. **`/api/cctp`** (GET, POST, PUT, DELETE)
   - CRUD complet CCTP

6. **`/api/cctp/[id]`** (GET, PUT, DELETE)
   - Opérations sur un CCTP spécifique

7. **`/api/documents/[id]/preview`** (GET)
   - Prévisualisation document

## ✅ Phase 6: Validation Zod

### Schémas à créer dans `src/lib/utils/validation.ts`:

- `extractDPGFSchema`
- `generateCTTPSchema`
- `dpgfStructuredSchema`
- `cctpGeneratedSchema`
- `documentUploadSchema` (amélioré)
- `imageUploadSchema`

## 🎨 Phase 7: UI Complète

### Composants à créer:

1. **Upload**
   - `DocumentUpload.tsx` - Upload multi-format avec drag & drop
   - `UploadProgress.tsx` - Barre de progression
   - `FilePreview.tsx` - Prévisualisation fichiers

2. **Documents**
   - `DocumentViewer.tsx` - Visualisation documents (PDF, images, texte)
   - `DocumentList.tsx` - Liste avec filtres
   - `DocumentCard.tsx` - Carte document

3. **DPGF**
   - `DPGFViewer.tsx` - Visualisation DPGF structuré
   - `DPGFEditor.tsx` - Édition DPGF
   - `DPGFExtractionStatus.tsx` - Statut extraction

4. **CCTP**
   - `CCTPGenerator.tsx` - Interface génération
   - `CCTPViewer.tsx` - Visualisation CCTP généré
   - `CCTPEditor.tsx` - Édition CCTP
   - `CCTPExport.tsx` - Export PDF/DOCX

5. **Dashboard**
   - `Dashboard.tsx` - Vue d'ensemble
   - `ProjectOverview.tsx` - Vue projet
   - `Analytics.tsx` - Métriques

### Pages à créer/améliorer:

- `/projects/[id]/documents` - Gestion documents projet
- `/projects/[id]/dpgf` - Extraction et gestion DPGF
- `/projects/[id]/cctp` - Génération et gestion CCTP
- `/projects/[id]/analyze` - Analyse documents

## 🔌 Phase 8: Hooks et Appels API

### Hooks à créer dans `src/hooks/`:

- `useDPGF.ts` - Gestion DPGF
- `useCCTP.ts` - Gestion CCTP
- `useDocumentUpload.ts` - Upload documents
- `useDocumentAnalysis.ts` - Analyse documents
- `useOCR.ts` - OCR images

### Utilitaires API (`src/lib/api/`):

- `api-client.ts` - Client API centralisé
- `endpoints.ts` - Définitions endpoints
- `error-handler.ts` - Gestion erreurs

---

## 📦 Ordre d'Exécution Recommandé

### Étape 1: Parsers (2-3h)
1. Parser DOCX
2. Parser Images + OCR
3. Parser unifié
4. Tests

### Étape 2: Module IA (3-4h)
1. Créer `/src/ia`
2. Pipelines extraction DPGF
3. Pipelines génération CCTP
4. Prompts avancés

### Étape 3: Services (2-3h)
1. DPGFService
2. CCTPService
3. Amélioration DocumentService

### Étape 4: Routes API (2-3h)
1. Routes DPGF
2. Routes CCTP
3. Validation Zod

### Étape 5: UI (4-5h)
1. Composants upload
2. Composants DPGF/CCTP
3. Pages dashboard

### Étape 6: Intégration (2h)
1. Hooks React
2. Tests end-to-end
3. Polish

---

## 🎯 Prochaines Actions Immédiates

1. **Installer dépendances**: `npm install`
2. **Créer parsers DOCX et images**
3. **Créer module `/src/ia`**
4. **Implémenter DPGFService**
5. **Créer routes API DPGF/CCTP**
6. **Créer UI complète**

---

## ⚠️ Notes Importantes

- **Performance**: OCR peut être lent → Utiliser workers/web workers
- **Stockage**: Compresser images avant OCR
- **Coûts IA**: Mettre en cache les résultats, optimiser prompts
- **Sécurité**: Valider strictement tous les uploads
- **Scalabilité**: Prévoir queue pour traitement long

---

**Date création**: 2024-12-12  
**Dernière mise à jour**: 2024-12-12  
**Statut**: Phase 1 terminée, Phase 2 en cours

