# Plan d'Intégration - RenovIA & Buildismart dans Redyce

## 📋 Vue d'ensemble

Ce document décrit le plan d'intégration des briques existantes de **RenovIA** (ingestion documents) et **Buildismart** (prompts IA) dans Redyce.

---

## 🏗️ Architecture Actuelle de Redyce

### Structure des modules

```
src/
├── lib/
│   ├── documents/          # Ingestion documentaire
│   │   ├── parser/         # Parsers PDF, DOCX, images
│   │   ├── extractors/     # Extracteurs spécifiques (CCTP, DPGF, RC, CCAP)
│   │   ├── processors/     # Orchestrateur de traitement
│   │   └── storage.ts      # Stockage fichiers
│   ├── ai/                 # Logique IA (legacy - à migrer)
│   │   ├── client.ts
│   │   ├── prompts/
│   │   └── pipelines/
│   └── logger.ts           # Logging
├── ia/                     # Module IA principal (actuel)
│   ├── client.ts           # Client OpenAI
│   ├── pipelines/          # Pipelines d'extraction/génération
│   ├── prompts/            # Prompts réutilisables
│   └── utils/              # Utilitaires (validation, structuration)
├── services/               # Services métier
│   ├── document-service.ts
│   ├── dpgf-service.ts
│   ├── cctp-service.ts
│   └── ...
└── app/api/                # Routes API
```

---

## 🎯 Objectifs d'Intégration

### RenovIA → Redyce
- **Parsing PDF avancé** : Extraction plus robuste, gestion des tableaux, schémas
- **Extraction d'éléments contractuels** : CCTP, DPGF, RC, CCAP plus précise
- **Détection de structure** : Reconnaissance automatique de sections, articles
- **Extraction de métadonnées** : Dates, références, signatures

### Buildismart → Redyce
- **Prompts optimisés** : Prompts éprouvés pour appels d'offres
- **Chaînes de génération** : Workflows de génération de documents
- **Templates de réponses** : Structures de réponses standardisées
- **Optimisation tokens** : Techniques d'économie de tokens

---

## 📦 Plan d'Intégration Détaillé

### Phase 1 : Analyse et Préparation

#### 1.1 Mapping des fonctionnalités

| RenovIA | Équivalent Redyce actuel | Intégration |
|---------|-------------------------|-------------|
| Parser PDF avancé | `src/lib/documents/parser/pdf-parser.ts` | **Améliorer** ou **Remplacer** |
| Extraction CCTP | `src/lib/documents/extractors/cctp-extractor.ts` | **Remplacer** |
| Extraction DPGF | `src/lib/documents/extractors/dpgf-extractor.ts` | **Remplacer** |
| Détection structure | N/A | **Ajouter** |
| Extraction métadonnées | N/A | **Ajouter** |

| Buildismart | Équivalent Redyce actuel | Intégration |
|-------------|-------------------------|-------------|
| Prompts CCTP | `src/ia/prompts/cctp-generation.ts` | **Remplacer/Améliorer** |
| Prompts DPGF | `src/ia/prompts/dpgf-extraction.ts` | **Remplacer/Améliorer** |
| Chaînes génération | `src/ia/pipelines/` | **Améliorer** |
| Templates réponses | N/A | **Ajouter** |
| Optimisation prompts | N/A | **Ajouter** |

---

### Phase 2 : Intégration RenovIA

#### 2.1 Modules à intégrer dans `src/lib/documents/`

##### A. Parsing PDF Avancé
**Fichier cible :** `src/lib/documents/parser/pdf-parser-enhanced.ts`

**Fonctionnalités RenovIA à intégrer :**
- Extraction de tableaux avec préservation de la structure
- Détection et extraction de schémas/diagrammes
- Extraction de métadonnées (auteur, dates, références)
- Gestion des documents multi-colonnes
- Reconnaissance de sections/chapitres

**Action :**
```typescript
// TODO: Intégrer le parser PDF avancé de RenovIA
// - Remplacer pdf-parser.ts par une version améliorée
// - Ou créer pdf-parser-enhanced.ts et router selon les besoins
// - Adapter les types pour correspondre à ParsedPDF
```

##### B. Extraction d'éléments contractuels
**Fichiers cibles :**
- `src/lib/documents/extractors/cctp-extractor-enhanced.ts`
- `src/lib/documents/extractors/dpgf-extractor-enhanced.ts`
- `src/lib/documents/extractors/rc-extractor-enhanced.ts`
- `src/lib/documents/extractors/ccap-extractor-enhanced.ts`

**Fonctionnalités RenovIA à intégrer :**
- Extraction structurée d'articles (numéros, titres, contenu)
- Extraction de prescriptions techniques précises
- Détection de références normatives (NF, EN, DTU, etc.)
- Extraction de listes de matériaux avec caractéristiques
- Détection de clauses contractuelles

**Action :**
```typescript
// TODO: Intégrer les extracteurs RenovIA
// - Garder l'interface BaseDocumentExtractor
// - Remplacer l'implémentation par celle de RenovIA
// - Adapter le format de sortie pour correspondre à DocumentExtractionResult
```

##### C. Détection de structure
**Fichier cible :** `src/lib/documents/analyzers/structure-analyzer.ts` (nouveau)

**Fonctionnalités RenovIA à intégrer :**
- Détection automatique de table des matières
- Reconnaissance de sections/chapitres
- Détection de numérotation (articles, paragraphes)
- Identification de types de contenus (texte, tableaux, listes)

**Action :**
```typescript
// TODO: Créer le module d'analyse de structure
// - Analyser la structure d'un document parsé
// - Retourner une structure hiérarchique (sections, sous-sections, articles)
// - Utilisable par les extracteurs pour améliorer la précision
```

##### D. Extraction de métadonnées
**Fichier cible :** `src/lib/documents/analyzers/metadata-extractor.ts` (nouveau)

**Fonctionnalités RenovIA à intégrer :**
- Extraction de dates (signature, émission, validité)
- Extraction de références (numéros d'appels d'offres, contrats)
- Détection de signatures/approbations
- Extraction d'informations légales

**Action :**
```typescript
// TODO: Créer le module d'extraction de métadonnées
// - Analyser le document pour extraire métadonnées structurées
// - Retourner un objet de métadonnées normalisé
// - Utilisable pour enrichir les documents en base
```

#### 2.2 Adaptations nécessaires

##### A. Types TypeScript
- Adapter les types RenovIA pour correspondre aux types Redyce
- Créer des mappers si nécessaire
- Préserver la compatibilité avec le schéma Prisma

##### B. Intégration avec DocumentProcessor
- Modifier `DocumentProcessor` pour utiliser les nouveaux extracteurs
- Ajouter une option pour choisir entre extracteur basique et avancé
- Préserver la rétrocompatibilité

##### C. Stockage des résultats
- Les résultats doivent correspondre au schéma Prisma actuel
- Enrichir `DocumentAnalysis.result` avec les nouvelles métadonnées
- Prévoir des migrations si nouvelles données importantes

---

### Phase 3 : Intégration Buildismart

#### 3.1 Modules à intégrer dans `src/ia/`

##### A. Prompts optimisés
**Fichiers cibles :**
- `src/ia/prompts/cctp-generation-enhanced.ts`
- `src/ia/prompts/dpgf-extraction-enhanced.ts`
- `src/ia/prompts/memory-generation-enhanced.ts`

**Fonctionnalités Buildismart à intégrer :**
- Prompts éprouvés pour appels d'offres
- Techniques de prompt engineering (few-shot, chain-of-thought)
- Gestion du contexte long
- Optimisation tokens

**Action :**
```typescript
// TODO: Intégrer les prompts Buildismart
// - Remplacer ou compléter les prompts existants
// - Ajouter des variantes selon le contexte
// - Préserver la compatibilité avec les pipelines existants
```

##### B. Chaînes de génération
**Fichiers cibles :**
- `src/ia/pipelines/cctp-generation-enhanced.ts`
- `src/ia/pipelines/memory-generation-enhanced.ts`

**Fonctionnalités Buildismart à intégrer :**
- Workflows multi-étapes (planning → rédaction → révision)
- Génération itérative avec feedback
- Validation automatique des résultats
- Optimisation des coûts (appels API)

**Action :**
```typescript
// TODO: Améliorer les pipelines avec les techniques Buildismart
// - Intégrer les workflows multi-étapes
// - Ajouter la validation automatique
// - Optimiser les appels API
```

##### C. Templates de réponses
**Fichier cible :** `src/ia/templates/` (nouveau dossier)

**Fonctionnalités Buildismart à intégrer :**
- Templates structurés pour CCTP
- Templates pour mémoires techniques
- Templates pour réponses appels d'offres
- Système de personnalisation

**Action :**
```typescript
// TODO: Créer le système de templates
// - Définir des structures de templates
// - Créer des templates par type de document
// - Permettre la personnalisation par projet
```

##### D. Optimisation des prompts
**Fichier cible :** `src/ia/utils/prompt-optimizer.ts` (nouveau)

**Fonctionnalités Buildismart à intégrer :**
- Réduction de la longueur des prompts
- Compression du contexte
- Réutilisation de résultats intermédiaires
- Cache intelligent

**Action :**
```typescript
// TODO: Créer l'utilitaire d'optimisation
// - Techniques de compression de contexte
// - Cache des résultats intermédiaires
// - Réduction des tokens utilisés
```

#### 3.2 Adaptations nécessaires

##### A. Client IA
- Vérifier la compatibilité avec `iaClient` existant
- Adapter si nécessaire les méthodes d'appel
- Préserver la gestion d'erreurs actuelle

##### B. Pipelines existants
- Les pipelines doivent rester compatibles avec les services
- Ajouter des options pour utiliser les versions améliorées
- Prévoir une migration progressive

##### C. Validation et structuration
- Les résultats doivent toujours passer par `validator.ts`
- Adapter les validations si nouvelles structures
- Préserver la compatibilité avec Prisma

---

### Phase 4 : Services à créer/modifier

#### 4.1 Services à créer

##### A. `src/services/extraction-service.ts` (nouveau)
**Objectif :** Orchestrer l'extraction avec les nouveaux extracteurs RenovIA

```typescript
// TODO: Créer le service d'extraction avancée
export class ExtractionService {
  // Utilise les extracteurs RenovIA
  async extractContractualElements(documentId: string, type: string)
  async extractMetadata(documentId: string)
  async analyzeStructure(documentId: string)
}
```

##### B. `src/services/prompt-service.ts` (nouveau)
**Objectif :** Gérer les prompts et templates Buildismart

```typescript
// TODO: Créer le service de gestion des prompts
export class PromptService {
  async getOptimizedPrompt(type: string, context: any)
  async applyTemplate(templateId: string, data: any)
  async optimizePrompt(prompt: string, maxTokens: number)
}
```

#### 4.2 Services à modifier

##### A. `src/services/dpgf-service.ts`
- Utiliser les nouveaux extracteurs RenovIA
- Améliorer avec les prompts Buildismart
- Ajouter extraction de métadonnées

##### B. `src/services/cctp-service.ts`
- Utiliser les prompts optimisés Buildismart
- Intégrer les templates de réponses
- Améliorer la génération avec workflows multi-étapes

##### C. `src/services/document-service.ts`
- Intégrer l'analyse de structure
- Ajouter extraction de métadonnées
- Enrichir les résultats d'analyse

---

## 🔄 Stratégie de Migration

### Approche progressive

1. **Phase 1 : Préparation** (Semaine 1)
   - Créer les fichiers stub avec TODOs
   - Documenter les interfaces attendues
   - Tester la compatibilité des types

2. **Phase 2 : Intégration RenovIA** (Semaine 2-3)
   - Parser PDF avancé (tester en parallèle)
   - Extracteurs améliorés (version par version)
   - Analyseurs (structure + métadonnées)

3. **Phase 3 : Intégration Buildismart** (Semaine 4-5)
   - Prompts optimisés (tester en parallèle)
   - Pipelines améliorés
   - Templates et optimisation

4. **Phase 4 : Consolidation** (Semaine 6)
   - Tests end-to-end
   - Migration progressive en production
   - Monitoring et ajustements

### Compatibilité

- **Préservation des interfaces** : Les services publics restent identiques
- **Feature flags** : Permettre d'activer/désactiver les nouvelles versions
- **Fallback** : En cas d'erreur, utiliser les versions actuelles
- **Tests** : Tests parallèles avec anciennes et nouvelles versions

---

## 📁 Structure Proposée

### Nouveaux dossiers/fichiers à créer

```
src/lib/documents/
├── parser/
│   ├── pdf-parser-enhanced.ts      # [RENOVIA] Parser PDF avancé
│   └── pdf-parser.ts               # Actuel (garder comme fallback)
├── extractors/
│   ├── cctp-extractor-enhanced.ts  # [RENOVIA] Extraction CCTP avancée
│   ├── dpgf-extractor-enhanced.ts  # [RENOVIA] Extraction DPGF avancée
│   └── ... (autres extracteurs)
├── analyzers/                      # [RENOVIA] Nouveau dossier
│   ├── structure-analyzer.ts       # Analyse de structure
│   └── metadata-extractor.ts       # Extraction métadonnées
└── ...

src/ia/
├── prompts/
│   ├── cctp-generation-enhanced.ts # [BUILDISMART] Prompts optimisés
│   ├── dpgf-extraction-enhanced.ts # [BUILDISMART] Prompts optimisés
│   └── ...
├── pipelines/
│   ├── cctp-generation-enhanced.ts # [BUILDISMART] Pipeline amélioré
│   └── ...
├── templates/                      # [BUILDISMART] Nouveau dossier
│   ├── cctp-template.ts
│   ├── memory-template.ts
│   └── ...
└── utils/
    ├── prompt-optimizer.ts         # [BUILDISMART] Optimisation prompts
    └── ...

src/services/
├── extraction-service.ts           # [RENOVIA] Nouveau service
└── prompt-service.ts               # [BUILDISMART] Nouveau service
```

---

## 🧪 Plan de Tests

### Tests unitaires
- [ ] Parser PDF avancé (vs actuel)
- [ ] Extracteurs RenovIA (vs actuels)
- [ ] Prompts Buildismart (qualité, tokens)
- [ ] Pipelines améliorés (résultats, performance)

### Tests d'intégration
- [ ] Flux complet : Upload → Parse → Extract → Generate
- [ ] Comparaison résultats anciennes vs nouvelles versions
- [ ] Performance (temps, tokens, coûts)

### Tests de régression
- [ ] Tous les cas de test existants doivent toujours passer
- [ ] API endpoints inchangés
- [ ] Compatibilité schéma Prisma

---

## 📊 Métriques de Succès

### Qualité
- **Précision extraction** : +20% vs version actuelle
- **Qualité génération** : Score utilisateur +15%
- **Couverture** : +30% de cas gérés

### Performance
- **Temps traitement** : ≤ 2x le temps actuel (acceptable pour meilleure qualité)
- **Tokens utilisés** : -10% grâce à optimisation
- **Coûts API** : -10% grâce à optimisation

### Compatibilité
- **Rétrocompatibilité** : 100% des fonctionnalités existantes
- **Pas de breaking changes** : API inchangée
- **Migration transparente** : Feature flags

---

## 🚀 Prochaines Étapes

### Immédiat (Stubs)

1. Créer les fichiers stub avec TODOs dans :
   - `src/lib/documents/parser/pdf-parser-enhanced.ts`
   - `src/lib/documents/extractors/*-extractor-enhanced.ts`
   - `src/lib/documents/analyzers/structure-analyzer.ts`
   - `src/lib/documents/analyzers/metadata-extractor.ts`
   - `src/ia/prompts/*-enhanced.ts`
   - `src/ia/templates/`
   - `src/ia/utils/prompt-optimizer.ts`
   - `src/services/extraction-service.ts`
   - `src/services/prompt-service.ts`

2. Documenter les interfaces attendues dans chaque stub

3. Préparer les tests de compatibilité

### Court terme (Intégration)

1. Intégrer le parser PDF RenovIA
2. Intégrer les extracteurs RenovIA (un par un)
3. Intégrer les prompts Buildismart
4. Tester chaque intégration isolément

### Moyen terme (Optimisation)

1. Améliorer les pipelines avec techniques Buildismart
2. Ajouter analyse de structure et métadonnées
3. Implémenter templates et optimisation
4. Monitoring et ajustements

---

## 📝 Notes Importantes

### Points d'attention

1. **Types TypeScript** : Assurer la compatibilité des types entre RenovIA/Buildismart et Redyce
2. **Schéma Prisma** : Les nouvelles données doivent s'adapter au schéma existant ou prévoir migrations
3. **Performance** : Les améliorations ne doivent pas dégrader significativement les performances
4. **Coûts** : Optimiser les coûts API avec les techniques Buildismart
5. **Tests** : Maintenir une couverture de tests élevée

### Risques identifiés

1. **Incompatibilité de types** : Risque modéré → Créer des mappers
2. **Performance dégradée** : Risque faible → Tests de performance
3. **Breaking changes** : Risque faible → Feature flags et fallback
4. **Complexité accrue** : Risque modéré → Documentation et tests

---

## ✅ Checklist d'Intégration

### RenovIA
- [ ] Parser PDF avancé intégré
- [ ] Extracteurs CCTP/DPGF/RC/CCAP améliorés
- [ ] Analyseur de structure fonctionnel
- [ ] Extracteur de métadonnées fonctionnel
- [ ] Tests de compatibilité passés
- [ ] Documentation à jour

### Buildismart
- [ ] Prompts optimisés intégrés
- [ ] Pipelines améliorés fonctionnels
- [ ] Système de templates implémenté
- [ ] Optimiseur de prompts fonctionnel
- [ ] Tests de qualité passés
- [ ] Documentation à jour

### Intégration globale
- [ ] Services créés et testés
- [ ] Feature flags implémentés
- [ ] Tests end-to-end passés
- [ ] Performance validée
- [ ] Migration planifiée

---

**Document créé le :** 2024-12-12
**Version :** 1.0
**Auteur :** Équipe Redyce

