# Analyse du Projet Redyce - Gaps et Plan d'Action

## 📊 État Actuel du Projet

### ✅ Ce qui existe déjà

1. **Architecture de base**
   - Next.js 14 App Router configuré
   - TypeScript strict
   - Prisma + PostgreSQL configurés
   - Structure modulaire en place

2. **Schéma Prisma**
   - User, Project, Document, DocumentAnalysis, Memory, ChatMessage, KnowledgeChunk
   - Relations basiques configurées

3. **Routes API (squelettes)**
   - `/api/projects` (GET, POST)
   - `/api/projects/[id]` (GET, PUT, DELETE)
   - `/api/documents/upload` (POST)
   - `/api/documents/[id]/parse` (POST)
   - `/api/ai/analyze` (POST)
   - `/api/ai/memory` (POST)
   - `/api/ai/chat` (POST)

4. **Services métier**
   - ProjectService (complet)
   - DocumentService (basique)
   - AnalysisService (basique)
   - MemoryService (basique)
   - AIService (basique)

5. **Parsers/Extracteurs**
   - PDF parser (pdf-parse)
   - Extracteurs squelettes: CCTP, DPGF, RC, CCAP
   - Base extractor avec extraction de sections

6. **Client IA**
   - OpenAI client configuré
   - Prompts basiques (memory, analysis, chat)

7. **UI**
   - Composants UI de base (Button, Card, Input)
   - Pages dashboard squelettes
   - Liste factice de projets

---

## ❌ Ce qui MANQUE pour les objectifs

### 1. Formats de documents manquants
- ❌ Parser DOCX (mammoth ou docx)
- ❌ Parser images (OCR avec Tesseract ou API)
- ❌ Gestion multi-format unifiée

### 2. Modèles Prisma structurés
- ❌ Modèle DPGF structuré (extraction complète)
- ❌ Modèle CCTP structuré (génération complète)
- ❌ Modèle pour stocker les données extraites

### 3. Extraction DPGF automatique
- ❌ Pipeline IA pour extraction structurée
- ❌ Validation et normalisation des données DPGF
- ❌ Stockage structuré en base

### 4. Génération CCTP
- ❌ Pipeline de génération CCTP depuis DPGF
- ❌ Templates et structures CCTP
- ❌ Export CCTP (PDF/DOCX)

### 5. Module IA structuré
- ❌ Module `/src/ia` (actuellement `/src/lib/ai`)
- ❌ Pipelines complets d'analyse
- ❌ Prompts avancés pour DPGF/CCTP
- ❌ Gestion de contexte et chaînage

### 6. Routes API manquantes
- ❌ `/api/documents/extract-dpgf` - Extraction DPGF
- ❌ `/api/documents/generate-cctp` - Génération CCTP
- ❌ `/api/documents/[id]/preview` - Prévisualisation
- ❌ `/api/dpgf` - CRUD DPGF structuré
- ❌ `/api/cctp` - CRUD CCTP généré

### 7. Validation Zod
- ❌ Schémas complets pour tous les endpoints
- ❌ Validation des uploads (formats, tailles)
- ❌ Validation des données DPGF/CCTP

### 8. UI complète
- ❌ Interface d'upload multi-format
- ❌ Visualisation de documents
- ❌ Interface d'analyse en temps réel
- ❌ Visualisation DPGF extrait
- ❌ Éditeur/générateur CCTP
- ❌ Dashboard avec métriques

### 9. Appels API client-side
- ❌ Hooks React complets
- ❌ Gestion d'état pour uploads
- ❌ Gestion d'état pour analyses
- ❌ Feedback utilisateur (loading, errors)

### 10. Utilitaires manquants
- ❌ OCR pour images
- ❌ Export PDF/DOCX
- ❌ Compression d'images
- ❌ Gestion d'erreurs robuste

---

## 🎯 Plan d'Action Détaillé

### Phase 1: Fondations et Parsers (Priorité HAUTE)
1. Ajouter dépendances (mammoth, sharp, tesseract.js ou API OCR)
2. Créer parsers DOCX et images
3. Unifier interface de parsing
4. Mettre à jour DocumentProcessor

### Phase 2: Modèles Prisma et Structures (Priorité HAUTE)
1. Créer modèles DPGFStructured et CCTPGenerated
2. Ajouter relations avec Document et Project
3. Migrer le schéma

### Phase 3: Module IA Structuré (Priorité HAUTE)
1. Créer `/src/ia` (copier/migrer depuis `/src/lib/ai`)
2. Implémenter pipeline extraction DPGF
3. Implémenter pipeline génération CCTP
4. Créer prompts avancés

### Phase 4: Services et Logique Métier (Priorité HAUTE)
1. DPGFService - Extraction et gestion
2. CCTPService - Génération et gestion
3. Améliorer DocumentService (multi-format)
4. Améliorer AnalysisService (OCR, extraction avancée)

### Phase 5: Routes API (Priorité HAUTE)
1. Routes extraction DPGF
2. Routes génération CCTP
3. Routes CRUD DPGF/CCTP
4. Routes preview documents
5. Validation Zod complète

### Phase 6: UI et Expérience Utilisateur (Priorité MOYENNE)
1. Composant Upload multi-format
2. Composant DocumentViewer
3. Composant DPGFViewer/Editor
4. Composant CCTPGenerator
5. Pages dashboard complètes
6. Feedback visuel (loading, progress)

### Phase 7: Intégration Client-Server (Priorité MOYENNE)
1. Hooks React complets
2. Gestion d'état (React Query ou Zustand)
3. Gestion d'erreurs UI
4. Optimistic updates

### Phase 8: Tests et Documentation (Priorité BASSE)
1. Tests unitaires services
2. Tests d'intégration API
3. Documentation API
4. Guide utilisateur

---

## 📋 Détails Techniques par Composant

### Parser DOCX
- Utiliser `mammoth` pour extraction texte
- Conserver formatage basique
- Extraire images intégrées

### OCR Images
- Option 1: Tesseract.js (local, gratuit)
- Option 2: API Google Vision / AWS Textract (cloud, payant)
- Recommandation: Commencer avec Tesseract.js

### Structure DPGF
```typescript
interface DPGFStructured {
  // Informations générales
  titre: string
  dateCreation: Date
  reference: string
  
  // Articles et prescriptions
  articles: Array<{
    numero: string
    titre: string
    prescriptions: string[]
  }>
  
  // Matériaux et produits
  materiaux: Array<{
    designation: string
    caracteristiques: Record<string, string>
    normes: string[]
  }>
  
  // Métadonnées
  metadata: Record<string, any>
}
```

### Structure CCTP
```typescript
interface CCTPGenerated {
  // Informations projet
  projet: {
    nom: string
    reference: string
    lieu: string
  }
  
  // Basé sur DPGF
  prescriptionsTechniques: Array<{
    article: string
    description: string
    exigences: string[]
  }>
  
  // Contenu généré
  sections: Array<{
    titre: string
    contenu: string
  }>
}
```

---

## 🚀 Ordre d'Implémentation Recommandé

1. **JOUR 1**: Parsers multi-format + Modèles Prisma
2. **JOUR 2**: Module IA + Pipelines extraction DPGF
3. **JOUR 3**: Pipeline génération CCTP + Services
4. **JOUR 4**: Routes API complètes + Validation
5. **JOUR 5**: UI Upload + Visualisation
6. **JOUR 6**: UI DPGF/CCTP + Intégration complète
7. **JOUR 7**: Tests + Documentation + Polish

---

## ⚠️ Points d'Attention

1. **Performance**: OCR peut être lent → Traitement asynchrone
2. **Stockage**: Fichiers images volumineux → Compression
3. **Coûts IA**: OpenAI API → Cache et optimisation prompts
4. **Sécurité**: Validation stricte uploads, sanitization
5. **Scalabilité**: Queue pour traitement long (Bull/BullMQ)

---

**Prochaines étapes**: Valider ce plan puis commencer Phase 1.

