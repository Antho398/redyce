# Redyce Design System

## Largeurs de conteneur

### Largeur standard pour les pages principales de la sidebar

**Norme : `max-w-7xl` (1280px)**

Toutes les pages principales accessibles via la sidebar globale doivent utiliser la largeur maximale de `max-w-7xl` pour garantir une cohérence visuelle et un alignement parfait avec les bandeaux dégradés.

**Pages concernées :**
- ✅ Dashboard (Projets) : `/projects`
- ✅ Fichiers & sources : `/documents`
- ✅ Bibliothèque de mémoires : `/memoire`

**Implémentation standard :**
```tsx
<div className="max-w-7xl mx-auto space-y-4 py-4 px-4">
  <ProjectHeader
    title="Titre de la page"
    subtitle="Description"
    primaryAction={/* Action principale optionnelle */}
  />
  {/* Contenu de la page */}
</div>
```

**Variable CSS disponible :**
```css
--container-max-width: 80rem; /* max-w-7xl (1280px) */
```

**Exceptions :**
- Pages de paramètres (`/settings/*`) : `max-w-4xl` (formulaires, meilleure lisibilité)
- Pages de création/édition spécifiques : largeurs adaptées selon le contexte (ex: `max-w-3xl` pour formulaires compacts)

## Composants

### ProjectHeader

Composant standard pour tous les headers de pages avec bandeau dégradé.

**Utilisation :**
```tsx
<ProjectHeader
  title="Titre"
  subtitle="Description"
  primaryAction={<Button>Action</Button>}
/>
```

**Caractéristiques :**
- Utilise automatiquement `bg-gradient-header` (s'adapte au mode clair/sombre)
- Respecte la largeur du conteneur parent
- Espacement cohérent avec `p-3`

## Variables CSS

Voir `src/app/globals.css` pour les tokens de couleur et les variables du design system.

## Dark Mode

### Configuration

Le dark mode est géré par `ThemeContext` (`src/contexts/ThemeContext.tsx`) :
- **3 options** : `light`, `dark`, `system`
- **Persistance** : `localStorage` avec la clé `redyce_theme`
- **Anti-flash** : Script inline dans `layout.tsx` applique le thème AVANT le rendu React
- **Suivi système** : En mode `system`, le thème suit `prefers-color-scheme` et réagit en temps réel

### Utilisation

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  
  // theme: 'light' | 'dark' | 'system' (choix utilisateur)
  // resolvedTheme: 'light' | 'dark' (thème effectif)
  // setTheme: (theme, showFeedback?) => void
}
```

### Tokens de couleur

Toutes les couleurs sont définies via des variables CSS dans `globals.css` :
- `:root` pour le mode clair
- `.dark` pour le mode sombre

**Tokens principaux :**
- `--background`, `--foreground` : couleurs de base
- `--card`, `--card-foreground` : surfaces/cartes
- `--muted`, `--muted-foreground` : éléments secondaires
- `--primary`, `--primary-foreground` : couleur d'accent principale
- `--border`, `--input` : bordures et inputs

### Règles d'implémentation

**NE PAS utiliser :**
- Couleurs hardcodées (`#151959`, `#64748b`, etc.)
- Classes Tailwind avec couleurs fixes (`bg-white`, `text-gray-500`)

**UTILISER :**
- Tokens CSS via Tailwind : `bg-card`, `text-foreground`, `text-muted-foreground`
- Classes utilitaires : `bg-background`, `border-border`

### Page de paramètres

La page `/settings/interface` permet de :
- Choisir entre Clair / Sombre / Système
- Voir le thème actuellement appliqué ("Appliqué")
- Feedback toast discret au changement

