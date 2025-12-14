# Architecture Générique des Livrables Techniques - Redyce

## Vue d'ensemble

L'architecture des livrables techniques a été refondue pour être **générique et scalable**, permettant de gérer DPGF, CCTP et tous les futurs livrables avec une logique commune.

## Principes clés

### 1. Généricité
- **Aucun code spécifique** pour DPGF ou CCTP en dehors de leur configuration
- Architecture basée sur des types et configurations
- Composants réutilisables pour tous les livrables

### 2. Scalabilité
- Ajout d'un nouveau livrable = ajout d'une configuration
- Pas de refonte nécessaire pour ajouter de nouveaux types
- Structure prête pour RC, CCAP, etc.

### 3. UX Cohérente
- **Aucune redirection silencieuse** vers /documents
- Messages explicites pour chaque état
- Actions claires et guidées

## Structure des fichiers

```
src/
├── types/
│   └── livrables.ts              # Types et interfaces génériques
├── config/
│   └── livrables-config.ts       # Configuration de chaque livrable
├── components/
│   └── livrables/
│       ├── LivrablePage.tsx              # Composant principal générique
│       ├── LivrableSourcesSection.tsx    # Section documents sources
│       ├── LivrableGenerationSection.tsx # Section génération
│       └── LivrableResultSection.tsx     # Section résultat/visualisation
└── app/(dashboard)/projects/[id]/
    ├── dpgf/page.tsx             # Page DPGF (utilise LivrablePage)
    └── cctp/page.tsx             # Page CCTP (utilise LivrablePage)
```

## Types et configuration

### Types de livrables

```typescript
enum LivrableType {
  DPGF = 'DPGF',
  CCTP = 'CCTP',
  // Futurs: RC, CCAP, etc.
}
```

### États possibles

```typescript
type LivrableStatus =
  | 'no_documents'              // Aucun document source
  | 'documents_not_analyzed'    // Documents uploadés mais non analysés
  | 'ready_to_generate'         // Prêt à générer
  | 'generating'                // En cours de génération
  | 'generated'                 // Généré avec succès
  | 'error'                     // Erreur de génération
```

### Configuration d'un livrable

Chaque livrable est défini dans `livrables-config.ts` :

```typescript
interface LivrableConfig {
  type: LivrableType
  name: string                    // Nom affiché
  description: string             // Description du rôle
  icon: React.ComponentType       // Icône
  apiEndpoint: string             // Endpoint API
  requiresDocuments?: boolean     // Nécessite des documents
  canGenerateFromDocuments?: boolean  // Peut générer depuis docs
  canGenerateFromDPGF?: boolean   // Peut générer depuis DPGF
  requiresDPGF?: boolean          // Nécessite un DPGF validé
}
```

## Composants

### LivrablePage

Composant principal qui orchestre toutes les sections. Il :

1. **Gère les états** automatiquement selon les données
2. **Charge les documents et livrables** du projet
3. **Orchestre les sections** (Sources, Génération, Résultat)
4. **Gère les erreurs** et le loading

**Utilisation** :

```typescript
<LivrablePage
  livrableType={LivrableType.DPGF}
  projectId={projectId}
  onGenerate={handleGenerate}
  onFetchLivrables={fetchLivrables}
  onFetchDocuments={fetchDocuments}
  onValidate={handleValidate}
  onExport={handleExport}
/>
```

### Sections

#### LivrableSourcesSection
Affiche les documents sources avec :
- Liste des documents
- Statut d'analyse (uploadé, en cours, analysé, erreur)
- Lien pour ajouter des documents

#### LivrableGenerationSection
Gère la génération selon l'état :
- **no_documents** : Message + bouton "Ajouter des documents"
- **documents_not_analyzed** : Message "Analyse en cours"
- **ready_to_generate** : Formulaire + bouton de génération
- **generating** : Indicateur de progression
- **error** : Message d'erreur + bouton "Réessayer"
- **generated** : Succès + possibilité de régénérer

#### LivrableResultSection
Affiche les livrables générés :
- Historique des versions
- Informations du livrable sélectionné
- Actions (Valider, Finaliser, Exporter, Télécharger)
- Visualisation via composants spécifiques (DPGFTableViewer, CCTPSplitViewer)

## Pages spécifiques

### Page DPGF

```typescript
// src/app/(dashboard)/projects/[id]/dpgf/page.tsx

<LivrablePage
  livrableType={LivrableType.DPGF}
  projectId={projectId}
  onGenerate={async () => {
    // Extraction depuis le premier document analysé
    const documents = await fetchDocuments(projectId)
    const analyzed = documents.filter(d => d.status === 'processed')
    return extractDPGF(analyzed[0].id)
  }}
  onFetchLivrables={fetchDPGFs}
  onFetchDocuments={fetchDocuments}
  onValidate={validateDPGF}
/>
```

### Page CCTP

```typescript
// src/app/(dashboard)/projects/[id]/cctp/page.tsx

<LivrablePage
  livrableType={LivrableType.CCTP}
  projectId={projectId}
  onGenerate={async (options) => {
    // Génération depuis DPGF ou documents
    if (selectedDpgfId) {
      return generateCCTPFromDPGF(selectedDpgfId, options)
    }
    return generateCCTPFromDocuments(projectId, options)
  }}
  onFetchLivrables={fetchCCTPs}
  onFetchDocuments={fetchDocuments}
  onFinalize={finalizeCCTP}
  selectedDpgfId={selectedDpgfId}
/>
```

## États UX et messages

### Aucun document
**Message** : "Ajoutez des documents au projet pour pouvoir générer ce livrable."
**Action** : Bouton "Ajouter des documents" (lien vers `/projects/[id]/documents`)

### Documents non analysés
**Message** : "Des documents sont présents mais doivent être analysés."
**Sous-message** : "Une fois l'analyse terminée, la génération sera disponible."
**Indicateur** : Badge "Analyse en cours"

### Prêt à générer
**Message** : Formulaire de génération (si applicable)
**Action** : Bouton "Générer le [LIVRABLE]" ou "Extraire un [LIVRABLE]"

### En cours de génération
**Message** : "Génération en cours..."
**Sous-message** : "Cela peut prendre quelques minutes."
**Indicateur** : Spinner animé

### Erreur
**Message** : "Erreur de génération"
**Détails** : Message d'erreur spécifique
**Action** : Bouton "Réessayer"

### Généré avec succès
**Affichage** : Section Résultat avec visualisation

## Ajouter un nouveau livrable

### 1. Ajouter le type

```typescript
// src/types/livrables.ts
export enum LivrableType {
  DPGF = 'DPGF',
  CCTP = 'CCTP',
  RC = 'RC',  // Nouveau
}
```

### 2. Ajouter la configuration

```typescript
// src/config/livrables-config.ts
export const LIVRABLES_CONFIG: Record<LivrableType, LivrableConfig> = {
  // ... existants
  [LivrableType.RC]: {
    type: LivrableType.RC,
    name: 'RC',
    description: 'Rapport de Contrôle - ...',
    icon: FileCheck, // Choisir une icône
    apiEndpoint: '/api/rc',
    requiresDocuments: true,
    canGenerateFromDocuments: true,
  },
}
```

### 3. Créer la page

```typescript
// src/app/(dashboard)/projects/[id]/rc/page.tsx
export default function ProjectRCPage({ params }: { params: { id: string } }) {
  return (
    <LivrablePage
      livrableType={LivrableType.RC}
      projectId={params.id}
      onGenerate={handleGenerateRC}
      onFetchLivrables={fetchRCs}
      onFetchDocuments={fetchDocuments}
    />
  )
}
```

### 4. Créer les routes API

- `POST /api/rc/generate`
- `GET /api/rc?projectId=xxx`
- `GET /api/rc/[id]`
- etc.

### 5. (Optionnel) Créer un viewer spécifique

Si le livrable nécessite une visualisation spécifique, créer un composant :

```typescript
// src/components/rc/RCViewer.tsx
export function RCViewer({ rcId }: { rcId: string }) {
  // Visualisation spécifique au RC
}
```

Puis l'intégrer dans `LivrableResultSection` si nécessaire.

## Avantages de cette architecture

### ✅ Maintenabilité
- Code centralisé et réutilisable
- Logique métier séparée de l'UI
- Facile à tester et déboguer

### ✅ Cohérence UX
- Même expérience pour tous les livrables
- Messages et actions uniformisés
- Pas de surprises pour l'utilisateur

### ✅ Scalabilité
- Ajout d'un livrable = configuration + page + API
- Pas de refonte nécessaire
- Architecture prête pour la croissance

### ✅ Flexibilité
- Chaque livrable peut avoir ses spécificités
- Configurations adaptables
- Composants extensibles

## Exemples d'utilisation

### Générer un DPGF

1. L'utilisateur va sur `/projects/[id]/dpgf`
2. S'il n'y a pas de documents : message + lien vers documents
3. S'il y a des documents non analysés : message "Analyse en cours"
4. S'il y a des documents analysés : bouton "Extraire un DPGF"
5. Clic → Extraction → Affichage du résultat

### Générer un CCTP

1. L'utilisateur va sur `/projects/[id]/cctp`
2. Vérification des prérequis (documents ou DPGF)
3. Si DPGF requis mais absent : message explicite
4. Formulaire de génération (exigences optionnelles)
5. Clic → Génération → Affichage du résultat

## Prochaines étapes possibles

1. **Sélection de document** : Permettre de choisir le document source pour DPGF
2. **Export unifié** : Système d'export générique pour tous les livrables
3. **Historique** : Historique unifié de toutes les générations
4. **Templates** : Système de templates pour chaque type de livrable
5. **Validation automatique** : Validation IA automatique selon le type

