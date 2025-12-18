# Export DOCX - Injection automatique des réponses

## Vue d'ensemble

Le système d'export DOCX permet d'injecter automatiquement les réponses du mémoire technique dans le template original, **sans aucune intervention de l'utilisateur**.

### Principe clé

> **L'utilisateur n'a jamais à manipuler de placeholders.** Le système génère un template technique interne avec des placeholders invisibles, puis remplace ces placeholders par les réponses validées lors de l'export.

## Compatibilité

### Templates DOCX ✅
- Les réponses sont automatiquement injectées après chaque question
- La mise en forme du document original est préservée
- Export en un clic via le bouton "Exporter DOCX rempli"

### Templates PDF ⚠️
- L'injection automatique n'est pas possible
- Les réponses doivent être copiées-collées manuellement
- Un mode "Copier les réponses" est disponible pour faciliter cette opération

## Architecture technique

### Flux de données

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Template DOCX  │────▶│  Template Interne    │────▶│  DOCX Final     │
│  (Original)     │     │  (avec placeholders) │     │  (avec réponses)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
         │                        │                          │
         ▼                        ▼                          ▼
    Upload par               Généré auto.               Téléchargé par
    l'utilisateur            au 1er export              l'utilisateur
```

### Composants

1. **`DocxInjectionService`** (`src/services/docx-injection-service.ts`)
   - Analyse la structure du DOCX (paragraphes, runs)
   - Trouve la position de chaque question
   - Génère le template interne avec placeholders
   - Exporte avec injection des réponses

2. **API d'export** (`/api/memos/[id]/export-docx`)
   - Vérifie la compatibilité DOCX
   - Génère le template interne si nécessaire
   - Injecte les réponses et retourne le fichier

3. **Utilitaires** (`src/lib/utils/docx-placeholders.ts`)
   - Génération de placeholders déterministes
   - Détection du type de template

## Système de placeholders (invisible pour l'utilisateur)

### Format interne

```
{{Q_XXXXXXXX}}
```

Où `XXXXXXXX` = 8 premiers caractères de l'ID de la question (majuscules).

### Stockage

Le template interne est stocké dans :
- **Fichier** : `uploads/internal-templates/{documentId}_injection.docx`
- **Métadonnées** : `DocumentAnalysis` avec `analysisType: 'docx_injection_template'`

### Mapping Question → Position

```typescript
interface QuestionPositionMapping {
  questionId: string           // ID unique de la question
  placeholder: string          // {{Q_XXXXXXXX}}
  questionTitle: string        // Texte de la question
  questionOrder: number        // Ordre dans le document
  position: {
    paragraphIndex: number     // Index du paragraphe
    contextBefore?: string     // Contexte pour validation
    contextAfter?: string
  }
}
```

## Comportement d'export

### Réponses manquantes

Si une question n'a pas de réponse :
- Le placeholder est remplacé par `[À compléter]`
- Ce texte est visible dans le document final

### Questions supprimées

Si une question a été supprimée du template :
- Le placeholder correspondant est ignoré
- Pas d'erreur générée

### Formatage

- Les paragraphes de placeholder sont créés avec une police invisible (taille 2pt, couleur blanche)
- Lors de l'export, ils sont convertis en paragraphes normaux avec le contenu de la réponse
- Word gère automatiquement les sauts de page et l'espacement

## UX - Indicateurs visuels

### Dans l'éditeur de mémoire

- **Bandeau vert** : "Compatible injection DOCX" - Export automatique disponible
- **Bandeau orange** : "Export manuel requis" - Template PDF détecté

### Boutons d'action

- **Exporter DOCX rempli** : Actif si template DOCX et sections présentes
- **Copier les réponses** : Visible si template PDF (fonctionnalité future)

## API

### POST /api/memos/[id]/export-docx

**Réponse succès** : Fichier DOCX binaire avec headers appropriés

```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="Mon_Memoire_v1.docx"
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": { "message": "Le template n'est pas au format DOCX" }
}
```

## Dépendances

- **jszip** : Manipulation des fichiers DOCX (format ZIP)
- **docx** : Création de documents (non utilisé pour l'injection)

## Limitations actuelles

1. Le matching des questions utilise une correspondance floue (80% des mots)
2. Les tableaux complexes peuvent ne pas être correctement traités
3. Le formatage riche des réponses n'est pas préservé (texte brut uniquement)

## Évolutions futures

- Support des tableaux et listes dans les réponses
- Préservation du formatage Markdown
- Génération de PDF à partir du DOCX exporté

