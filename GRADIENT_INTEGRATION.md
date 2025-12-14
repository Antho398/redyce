# Intégration des dégradés subtils

## Résumé

Ajout de dégradés très subtils dans certaines zones de l'UI pour apporter de la chaleur et de la profondeur, tout en restant ultra professionnel et discret.

## Dégradé utilisé

```css
linear-gradient(
  135deg,
  rgba(248, 211, 71, 0.12),  /* Jaune accent à 12% d'opacité */
  rgba(21, 25, 89, 0.04)      /* Bleu foncé à 4% d'opacité */
)
```

- **Angle** : 135deg (diagonal)
- **Couleur 1** : #F8D347 (accent warm) à 12% d'opacité
- **Couleur 2** : #151959 (primary) à 4% d'opacité
- **Effet** : Quasi imperceptible, apporte de la chaleur sans être dominant

## Classe CSS utilitaire

Ajoutée dans `globals.css` :

```css
.bg-gradient-subtle {
  background: linear-gradient(
    135deg,
    rgba(248, 211, 71, 0.12),
    rgba(21, 25, 89, 0.04)
  );
}
```

## Zones modifiées

### 1. Headers de page ✅

Tous les headers de page avec titre et description :

- `/projects` - Header "Projets"
- `/projects/[id]` - Header du projet
- `/projects/[id]/documents` - Header "Documents"
- `/projects/[id]/memoire` - Header "Mémoires techniques"
- `/projects/[id]/memoire/new` - Header "Nouveau mémoire technique"
- `/projects/[id]/memoire/[memoireId]` - Header "Édition du mémoire"
- `/projects/[id]/exigences` - Header "Exigences"
- `/projects/[id]/exports` - Header "Exports & versions"
- `/memoire` - Header "Mémoires techniques"

**Application** : `bg-gradient-subtle rounded-lg p-4 -mx-4 px-4` sur le conteneur du header

### 2. Empty states ✅

Tous les états vides (quand il n'y a pas de données) :

- `/projects` - "Aucun projet"
- `/projects/[id]/documents` - "Aucun document"
- `/projects/[id]/memoire` - "Aucun mémoire"
- `/projects/[id]/exigences` - "Aucune exigence"
- `/projects/[id]/exports` - "Aucun export"
- `/memoire` - "Aucun mémoire" (liste globale)

**Application** : `bg-gradient-subtle` sur la `Card` de l'empty state

### 3. Cartes d'introduction ✅

Cartes d'information ou d'avertissement :

- `/projects/[id]/documents` - Carte "Template mémoire requis"
- `/projects/[id]/memoire` - Carte "Template mémoire requis" (warning)

**Application** : `bg-gradient-subtle` ajouté en plus des classes existantes (comme `bg-yellow-50/50`)

## Zones interdites (non modifiées)

- ❌ Formulaires
- ❌ Tableaux
- ❌ Éditeur de texte
- ❌ Inputs et champs de saisie
- ❌ Modals et dialogs (sauf empty states à l'intérieur)

## Contraintes respectées

- ✅ **Dégradé quasi imperceptible** : Opacités très faibles (12% et 4%)
- ✅ **Non dominant** : Ne remplace jamais un fond principal, s'ajoute subtilement
- ✅ **Structure préservée** : Aucune modification de la structure HTML, uniquement ajout de classes CSS
- ✅ **Pas d'illustrations** : Aucune illustration ajoutée
- ✅ **Design professionnel** : Reste discret et élégant

## Fichiers modifiés

1. `src/app/globals.css` - Ajout de la classe `.bg-gradient-subtle`
2. `src/app/(dashboard)/projects/page.tsx` - Header + Empty state
3. `src/app/(dashboard)/projects/[id]/page.tsx` - Header
4. `src/app/(dashboard)/projects/[id]/documents/page.tsx` - Header + Empty state + Carte template
5. `src/app/(dashboard)/projects/[id]/memoire/page.tsx` - Header + Empty state + Carte warning
6. `src/app/(dashboard)/projects/[id]/memoire/new/page.tsx` - Header
7. `src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx` - Header
8. `src/app/(dashboard)/projects/[id]/exigences/page.tsx` - Header + Empty state
9. `src/app/(dashboard)/projects/[id]/exports/page.tsx` - Header + Empty state
10. `src/app/(dashboard)/memoire/page.tsx` - Header + Empty state

## Résultat visuel

Le dégradé apporte :
- Une légère chaleur visuelle (jaune accent)
- De la profondeur subtile (transition vers le bleu)
- Un aspect premium sans être marketing
- Une cohérence visuelle entre les zones importantes

Le dégradé est **quasi imperceptible** et ne doit jamais distraire de l'information principale.

