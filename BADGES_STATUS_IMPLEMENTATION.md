# Amélioration des badges et statuts

## Résumé

Ajout de variantes de badges pour distinguer visuellement :
- **Contenu utilisateur** : créé/édité par l'utilisateur
- **Contenu généré** : généré automatiquement par le système
- **Recommandations IA** : propositions de l'assistant IA

## Nouvelles variantes de badge

### 1. Variante "user" (Contenu utilisateur)
- **Style** : Neutre, sobre
- **Classes** : `border-border/50 bg-background text-foreground`
- **Usage** : Sections de mémoire éditées manuellement par l'utilisateur

### 2. Variante "generated" (Contenu généré)
- **Style** : Indication subtile de génération automatique
- **Classes** : `border-primary/20 bg-primary/5 text-foreground`
- **Usage** : 
  - Sections de mémoire générées depuis des exigences
  - Exigences extraites automatiquement depuis les documents
  - Contenu auto-généré par le système

### 3. Variante "ai" (Recommandations IA)
- **Style** : Très discret, utilise accent-warm (#F8D347) subtilement
- **Classes** : `border-accent-warm/30 bg-accent-warm/8 text-foreground`
- **Opacités** : Bordure à 30%, fond à 8% pour un effet très discret
- **Usage** : 
  - Badge "IA" sur les propositions de l'assistant
  - Indicateur discret pour les recommandations IA
- **Principe** : Jamais dominant, jamais décoratif, toujours crédible

## Implémentations

### Page d'édition mémoire (`/projects/[id]/memoire/[memoireId]`)

**Proposition IA** :
- Badge "IA" discret à côté du titre "Proposition"
- Utilise la variante `ai` avec opacités très faibles

**Liste des sections** :
- Badge "Utilisateur" ou "Généré" selon la source
- Logique : si `sourceRequirementIds.length > 0` → "Généré", sinon → "Utilisateur"
- Taille réduite : `text-[10px] px-1.5 py-0 h-4` pour rester discret

### Page des exigences (`/projects/[id]/exigences`)

**Exigences extraites** :
- Badge "Extraite" sur chaque exigence (variante `generated`)
- Indique clairement que le contenu a été extrait automatiquement

## Contraintes respectées

- ✅ **Réutilisation des composants** : Utilisation de la variante `Badge` existante
- ✅ **Variantes visuelles uniquement** : Pas de modification de structure HTML
- ✅ **#F8D347 pour IA uniquement** : Variante `ai` utilise accent-warm avec opacités très faibles (30% bordure, 8% fond)
- ✅ **Discret** : Badges IA jamais dominants, toujours sobres
- ✅ **Crédibilité** : Aspect professionnel, pas décoratif
- ✅ **Lisibilité métier** : Distinction claire entre types de contenu

## Exemples d'utilisation

```tsx
// Contenu utilisateur
<Badge variant="user" className="text-xs">Utilisateur</Badge>

// Contenu généré
<Badge variant="generated" className="text-xs">Généré</Badge>

// Recommandation IA (très discret)
<Badge variant="ai" className="text-xs">IA</Badge>
```

## Badges de statut existants (non modifiés)

Les badges de statut existants restent inchangés :
- `DRAFT`, `IN_PROGRESS`, `COMPLETED` pour les sections
- `PENDING`, `VALIDATED`, `REJECTED` pour les exigences
- `PROCESSING`, `ANALYZED`, `ERROR` pour les documents

Les nouvelles variantes s'ajoutent à ces statuts pour apporter une information complémentaire sur la **source** du contenu, pas son **état**.

