# Enrichissement du design system - Dégradés subtils

## Résumé

Enrichissement du design system existant par l'ajout de dégradés très subtils dans les headers de pages et les états vides, sans modifier la hiérarchie typographique ni les tailles de police.

## Dégradé utilisé

```css
linear-gradient(
  135deg,
  rgba(21, 25, 89, 0.04),    /* Bleu foncé primaire à 4% */
  rgba(248, 211, 71, 0.08)   /* Jaune accent #F8D347 à 8% */
)
```

**Direction** : Bleu foncé (dominant) → Jaune accent (subtile)
**Opacités** : 4% pour le bleu, 8% pour le jaune
**Effet** : Très léger, quasi imperceptible, enrichit sans dominer

## Classe CSS utilitaire

Ajoutée dans `globals.css` :

```css
.bg-gradient-subtle {
  background: linear-gradient(
    135deg,
    rgba(21, 25, 89, 0.04),
    rgba(248, 211, 71, 0.08)
  );
}
```

## Zones enrichies

### 1. Headers de pages ✅

Tous les headers de pages avec titre et description :

- `/projects` - Header "Projets"
- `/projects/[id]` - Header du projet
- `/projects/[id]/documents` - Header "Documents"
- `/projects/[id]/memoire` - Header "Mémoires techniques"
- `/projects/[id]/memoire/new` - Header "Nouveau mémoire technique"
- `/projects/[id]/memoire/[memoireId]` - Header "Édition du mémoire"
- `/projects/[id]/exigences` - Header "Exigences"
- `/projects/[id]/exports` - Header "Exports & versions"
- `/memoire` - Header "Mémoires techniques"

**Application** : `bg-gradient-subtle rounded-lg p-3 -mx-4 px-4` (ou `p-4` selon le cas)

### 2. Empty states ✅

Tous les états vides (quand il n'y a pas de données) :

- `/projects` - "Aucun projet"
- `/projects/[id]/documents` - "Aucun document"
- `/projects/[id]/memoire` - "Aucun mémoire"
- `/projects/[id]/exigences` - "Aucune exigence"
- `/projects/[id]/exports` - "Aucun export"
- `/memoire` - "Aucun mémoire" (liste globale)

**Application** : `bg-gradient-subtle` sur la `Card` de l'empty state

## Contraintes respectées

- ✅ **Aucun fond jaune plein** : Le dégradé utilise uniquement des opacités très faibles (4-8%)
- ✅ **Aucun texte jaune** : Le texte reste en `text-foreground` ou `text-muted-foreground`
- ✅ **Bleu foncé dominant** : Le dégradé commence par le bleu (4%) pour maintenir la dominance
- ✅ **Pas de modification typographique** : Hiérarchie et tailles de police inchangées
- ✅ **Enrichissement uniquement** : Ajout de la classe CSS, aucune modification structurelle

## Principe de design

Le dégradé apporte :
- Une légère profondeur visuelle
- Une touche de chaleur subtile (jaune accent)
- Un enrichissement discret sans dominer
- Une cohérence visuelle entre les zones importantes

Le bleu foncé (#151959) reste la couleur dominante grâce à :
- L'ordre du dégradé (bleu en premier)
- L'opacité plus faible du bleu (4% vs 8% pour le jaune)
- L'absence de fond jaune plein
- L'absence de texte jaune

## Fichiers modifiés

1. `src/app/globals.css` - Ajout/correction de la classe `.bg-gradient-subtle`
2. Toutes les pages de dashboard (headers et empty states)

## Résultat visuel

Le dégradé est **quasi imperceptible** et enrichit subtilement l'interface sans :
- Changer la hiérarchie visuelle
- Compromettre la lisibilité
- Introduire d'élément décoratif
- Modifier le design system existant

