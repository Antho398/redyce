# Intégration de la couleur accent #F8D347

## Résumé

Intégration de la couleur accent **#F8D347** (jaune doré) dans le design system Redyce de manière non-intrusive, sans modifier les couleurs existantes ni casser l'UI.

## Modifications effectuées

### 1. Variables CSS (`src/app/globals.css`)

- ✅ Ajout de `--accent-warm: 47 93% 63%` (HSL pour #F8D347)
- ✅ Ajout de `--accent-warm-foreground: 236 62% 22%` (bleu foncé pour contraste)
- ✅ Support du mode sombre avec les mêmes valeurs

### 2. Configuration Tailwind (`tailwind.config.ts`)

- ✅ Ajout de la couleur `accent-warm` dans l'extension des couleurs
- ✅ Accessible via `bg-accent-warm`, `text-accent-warm`, `border-accent-warm`, etc.

### 3. Composant Badge (`src/components/ui/badge.tsx`)

- ✅ Ajout de la variante `warm` pour les badges secondaires
- ✅ Utilisation : `<Badge variant="warm">...</Badge>`

### 4. Application dans l'UI

#### Page d'édition mémoire (`src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx`)

- ✅ **Icône Sparkles** : `text-accent-warm` pour l'indicateur IA
- ✅ **Boutons IA** : 
  - Hover subtil : `hover:bg-accent-warm/10 hover:border-accent-warm/30`
  - Focus ring : `focus-visible:ring-accent-warm/50`
  - Icônes : `text-accent-warm`
- ✅ **Loader IA** : `text-accent-warm` pour l'animation

#### Page documents (`src/app/(dashboard)/projects/[id]/documents/page.tsx`)

- ✅ **Badge "Template mémoire"** : Utilise `variant="warm"` au lieu de classes personnalisées

## Utilisation de la couleur accent

La couleur **#F8D347** est utilisée UNIQUEMENT pour :

1. ✅ **Badges secondaires** : Badge "Template mémoire" avec `variant="warm"`
2. ✅ **Indicateurs IA** : Icônes Sparkles et boutons d'actions IA
3. ✅ **Hover subtils** : Effets hover sur les boutons IA (`hover:bg-accent-warm/10`)
4. ✅ **Focus ring** : Ring de focus sur les boutons IA (`focus-visible:ring-accent-warm/50`)

## Contraintes respectées

- ✅ **Pas de modification des couleurs existantes** : `--primary`, `--accent`, etc. restent inchangés
- ✅ **Pas de fond plein principal** : La couleur n'est jamais utilisée comme fond principal, uniquement en accents subtils
- ✅ **Contraste vérifié** : Le bleu foncé (#151959) est utilisé comme foreground pour garantir la lisibilité
- ✅ **Design professionnel** : Utilisation discrète et élégante, pas d'effet marketing

## Classes Tailwind disponibles

```css
/* Couleurs de base */
bg-accent-warm          /* Fond accent-warm */
text-accent-warm        /* Texte accent-warm */
border-accent-warm      /* Bordure accent-warm */

/* Opacités (pour hover subtils) */
bg-accent-warm/10       /* Fond à 10% d'opacité */
border-accent-warm/30   /* Bordure à 30% d'opacité */
ring-accent-warm/50     /* Ring à 50% d'opacité */

/* Variante Badge */
<Badge variant="warm">...</Badge>
```

## Prochaines étapes (optionnel)

Si besoin d'étendre l'utilisation :

1. **Badges de statut secondaires** : Utiliser `variant="warm"` pour les statuts "En attente", "En cours" (non critiques)
2. **Indicateurs de progression** : Utiliser `text-accent-warm` pour les indicateurs de progression IA
3. **Notifications subtiles** : Utiliser `bg-accent-warm/10` pour les notifications d'information

## Notes techniques

- **HSL** : La couleur est stockée en HSL (47° 93% 63%) pour faciliter les variations d'opacité
- **Contraste** : Le contraste avec le bleu foncé (#151959) est vérifié et respecte les standards d'accessibilité
- **Mode sombre** : Les mêmes valeurs sont utilisées en mode sombre (à ajuster si nécessaire)

