# Détection des questions dans les templates DOCX

## Vue d'ensemble

Le système de détection analyse les templates DOCX pour identifier et positionner les questions de manière fiable et reproductible.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Template DOCX                               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Détection Structurelle │     │     Parsing IA          │
│  (docx-question-detector)│     │ (memory-template-parser) │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
              ┌─────────────────────────┐
              │   Fusion Hybride        │
              │ (template-hybrid-parser) │
              └─────────────────────────┘
                              │
                              ▼
              ┌─────────────────────────┐
              │  Questions Détectées    │
              │  + Mapping Positions    │
              └─────────────────────────┘
```

## Méthodes de détection (par ordre de priorité)

### 1. Styles Word (Priorité haute)

Le détecteur analyse les styles Word natifs du document :

| Style | Détection |
|-------|-----------|
| Heading 1-6 | Sections et titres principaux |
| Styles personnalisés "Question", "Item", etc. | Questions avec haute confiance |
| Bold/Italic | Indicateurs secondaires |

**Implémentation :**
- Lecture du fichier `word/styles.xml`
- Mapping `styleId` → `styleName`
- Détection des patterns de noms de styles

### 2. Numérotation (Priorité moyenne-haute)

Détection des listes numérotées Word et patterns textuels :

| Pattern | Exemple | Niveau |
|---------|---------|--------|
| Décimal simple | `1.`, `2.`, `3.` | Principal |
| Décimal multi | `1.1`, `2.3.1` | Sous-question |
| Lettre minuscule | `a)`, `b)`, `c.` | Sous-question |
| Lettre majuscule | `A)`, `B)` | Variable |
| Romain | `i)`, `ii)`, `iii)` | Sous-question |
| Parenthèses | `(1)`, `(a)` | Variable |
| Puces | `-`, `•` | Liste |

**Implémentation :**
- Lecture de `word/numbering.xml` pour les listes Word natives
- Regex sur le texte pour les numérotations manuelles

### 3. Heuristiques texte (Priorité moyenne)

#### Point d'interrogation
- Texte se terminant par `?`
- Minimum 3 mots (évite les faux positifs)
- Confiance : 0.9

#### Deux-points avec mot-clé
- Texte se terminant par `:`
- Présence d'un mot-clé d'introduction
- Confiance : 0.85

#### Mots-clés d'introduction

```
décrire, préciser, indiquer, expliquer, détailler,
présenter, fournir, lister, mentionner, joindre,
justifier, démontrer, proposer, définir, identifier,
énumérer, spécifier, comment, quels, quelles,
combien, pourquoi
```

#### Patterns spécifiques aux mémoires techniques

- `Si oui, ...` → Sous-question conditionnelle
- `Si non, ...` → Sous-question conditionnelle
- `Dans le cas où...` → Question conditionnelle
- `Autres précisions` → Point de complétion
- `Pièces jointes` → Demande de documents

## Gestion des cas spéciaux

### Questions dans les tableaux

Le détecteur analyse les tableaux Word :

1. Identifie les tableaux de questions (2+ colonnes)
2. Détecte l'en-tête (si présent)
3. Extrait les questions de la première colonne
4. Génère des IDs stables basés sur la position

```xml
<w:tbl>
  <w:tr> <!-- En-tête -->
    <w:tc>Question</w:tc>
    <w:tc>Réponse</w:tc>
  </w:tr>
  <w:tr> <!-- Question détectée -->
    <w:tc>Décrire votre organisation...</w:tc>
    <w:tc></w:tc>
  </w:tr>
</w:tbl>
```

### Questions multi-lignes

Les questions peuvent s'étendre sur plusieurs paragraphes :

- Détection du paragraphe principal (avec numérotation ou style)
- Les paragraphes suivants sans marqueurs sont considérés comme continuation

### Sous-questions (a / b / c)

Détection hiérarchique :

1. Question principale détectée (ex: `1. Décrire votre organisation`)
2. Sous-questions avec numérotation lettre (ex: `a) Effectifs`, `b) Organigramme`)
3. Lien parent établi via `parentQuestionId`

## Structure des données

### DetectedQuestion

```typescript
interface DetectedQuestion {
  questionId: string        // ID stable (hash)
  text: string              // Texte brut
  normalizedText: string    // Texte normalisé
  position: {
    paragraphIndex: number  // Index dans le document
    tableInfo?: {
      tableIndex: number
      rowIndex: number
      cellIndex: number
    }
  }
  parentSection?: DetectedSection
  parentQuestionId?: string
  level: number             // 1 = principal, 2 = sous-question
  detectionMethod: string   // Style, numérotation, heuristique
  confidence: number        // 0-1
  styleInfo?: StyleInfo
  numbering?: NumberingInfo
}
```

### Génération d'ID stable

L'ID est un hash SHA-256 basé sur :
- Préfixe (`question`, `section`, `ai`)
- Position dans le document
- Texte normalisé

```typescript
function generateStableId(text: string, position: number, prefix: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${prefix}:${position}:${text.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 12)
  
  return `${prefix}_${hash}`
}
```

**Avantage :** Reproductible à chaque parsing du même document.

## Fusion hybride (Structural + IA)

### Algorithme

1. **Détection structurelle** (toujours effectuée)
   - Parse le XML du DOCX
   - Génère des questions avec positions

2. **Parsing IA** (optionnel)
   - Enrichissement sémantique
   - Détection du type (TEXT/YES_NO)
   - Relations parent-enfant

3. **Fusion**
   - Pour chaque question structurelle, cherche une correspondance IA
   - Score de matching basé sur la similarité textuelle (>60%)
   - Questions IA non matchées ajoutées avec confiance réduite

### Sources de détection

| Source | Description | Confiance |
|--------|-------------|-----------|
| `structural` | Détection structurelle seule | Variable (0.8-0.95) |
| `ai` | Détection IA seule | 0.7 |
| `merged` | Fusion structural + IA | Max des deux |

## Statistiques de détection

```typescript
interface DetectionStats {
  totalQuestions: number
  mainQuestions: number      // level === 1
  subQuestions: number       // level === 2
  averageConfidence: number
  byMethod: {
    style_heading: number
    style_custom: number
    numbering_decimal: number
    numbering_letter: number
    heuristic_question: number
    heuristic_keyword: number
    table_cell: number
  }
  // Stats hybrides
  structuralOnly: number
  aiOnly: number
  merged: number
  aiMatchRate: number        // % de questions IA matchées
}
```

## Éviter les faux positifs

### Exclusions automatiques

- Styles `Title`, `Header`, `Footer`, `TOC`, `Caption`
- Paragraphes < 5 caractères
- Phrases interrogatives courtes (< 3 mots)

### Validation contextuelle

- Vérification du contexte avant/après
- Détection des listes simples (non-questions)
- Analyse de la structure du document

## Utilisation

### Parsing hybride (recommandé)

```typescript
import { parseTemplateHybrid, convertToTemplateFormat } from '@/services/template-hybrid-parser'

const result = await parseTemplateHybrid(buffer, {
  userId: 'user-id',
  projectId: 'project-id',
  useAI: true, // Active l'enrichissement IA
})

// Résultat au format template
const templateData = convertToTemplateFormat(result)
```

### Détection structurelle seule

```typescript
import { docxQuestionDetector } from '@/services/docx-question-detector'

const { questions, sections, stats } = await docxQuestionDetector.detectQuestions(buffer)
```

## Performance

- **Détection structurelle** : ~50-200ms selon la taille du document
- **Parsing IA** : ~2-5s (appel API)
- **Fusion** : ~10-50ms

La détection structurelle seule est suffisante pour la plupart des cas d'usage. Le parsing IA ajoute de la valeur pour :
- Détection du type de question (YES_NO)
- Relations parent-enfant complexes
- Formulaire entreprise

