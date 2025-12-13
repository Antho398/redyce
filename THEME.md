# Theme Redyce - Documentation UI Complète

> **Référence officielle du design system Redyce**  
> Dernière mise à jour : Décembre 2024

---

## 📋 Table des matières

1. [Palette de couleurs](#palette-de-couleurs)
2. [Typographie](#typographie)
3. [Composants UI](#composants-ui)
4. [Grille et espacement](#grille-et-espacement)
5. [Comportements interactifs](#comportements-interactifs)
6. [Bonnes pratiques design](#bonnes-pratiques-design)

---

## 🎨 Palette de couleurs

### Couleurs principales

La palette Redyce est conçue pour être moderne, professionnelle et accessible.

#### Primary (Principal)

- **Couleur** : `#151959` (Bleu foncé)
- **HSL** : `236 62% 22%`
- **Usage** : Boutons principaux, liens actifs, éléments d'action primaires, titres
- **Foreground** : `#FFFFFF` (Blanc) - Texte sur fond primary
- **Classes Tailwind** : `bg-primary`, `text-primary-foreground`, `border-primary`

#### Accent (Accent)

- **Couleur** : `#E3E7FF` (Bleu très clair)
- **HSL** : `231 100% 95%`
- **Usage** : Fonds d'accent, états hover légers, highlights, éléments secondaires
- **Foreground** : `#151959` (Primary) - Texte sur fond accent
- **Classes Tailwind** : `bg-accent`, `text-accent-foreground`, `hover:bg-accent`

#### Background (Arrière-plan)

- **Couleur** : `#F7F8FC` (Gris très clair)
- **HSL** : `228 45% 98%`
- **Usage** : Fond général de l'application
- **Classes Tailwind** : `bg-background`

#### Card/Surface (Surface)

- **Couleur** : `#FFFFFF` (Blanc pur)
- **HSL** : `0 0% 100%`
- **Usage** : Fond des cartes, modales, formulaires, conteneurs
- **Foreground** : `#1A1A1A` (Text)
- **Classes Tailwind** : `bg-card`, `text-card-foreground`

#### Text (Texte)

- **Couleur** : `#1A1A1A` (Noir/gris très foncé)
- **HSL** : `0 0% 10%`
- **Usage** : Texte principal, contenu
- **Classes Tailwind** : `text-foreground`

#### Border/Input (Bordures)

- **Couleur** : `#E3E3E8` (Gris clair)
- **HSL** : `240 10% 90%`
- **Usage** : Bordures des éléments, champs de saisie, séparateurs
- **Classes Tailwind** : `border-border`, `border-input`

#### Destructive (Danger)

- **Couleur** : `#DC2626` (Rouge)
- **HSL** : `0 72% 51%`
- **Usage** : Actions destructives, messages d'erreur
- **Foreground** : `#FFFFFF` (Blanc)
- **Classes Tailwind** : `bg-destructive`, `text-destructive-foreground`

#### Secondary & Muted

- **Secondary** : `#F5F5F8` (Gris très clair) - `228 20% 95%`
- **Muted** : `#F6F7FA` (Gris très clair) - `228 20% 96%`
- **Muted Foreground** : `#737373` (Gris moyen) - `240 5% 45%`
- **Usage** : Éléments secondaires, textes désactivés, légendes

### Variables CSS

Toutes les couleurs sont définies dans `src/app/globals.css` via des variables CSS :

```css
:root {
  --primary: 236 62% 22%;
  --primary-foreground: 0 0% 100%;
  --accent: 231 100% 95%;
  --accent-foreground: 236 62% 22%;
  --background: 228 45% 98%;
  --foreground: 0 0% 10%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 10%;
  --border: 240 10% 90%;
  --input: 240 10% 90%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  /* ... */
}
```

---

## 📝 Typographie

### Hiérarchie des titres

Redyce utilise une hiérarchie claire et lisible pour les titres.

#### H1 - Titre Principal de Page

- **Classe Tailwind** : `text-4xl font-bold tracking-tight`
- **Taille** : `2.25rem` (36px)
- **Poids** : `700` (bold)
- **Couleur** : `text-foreground`
- **Usage** : Titres de pages principales (`Mes Projets`, `Documents`, etc.)
- **Exemple** : `<h1 className="text-4xl font-bold tracking-tight text-foreground">Mes Projets</h1>`

#### H2 - Titre de Section

- **Classe Tailwind** : `text-2xl font-semibold tracking-tight`
- **Taille** : `1.5rem` (24px)
- **Poids** : `600` (semibold)
- **Couleur** : `text-foreground`
- **Usage** : Sections dans les pages, titres de cartes principales
- **Exemple** : `<h2 className="text-2xl font-semibold tracking-tight text-foreground">Documents existants</h2>`

#### H3 - Sous-titre

- **Classe Tailwind** : `text-xl font-semibold`
- **Taille** : `1.25rem` (20px)
- **Poids** : `600` (semibold)
- **Couleur** : `text-foreground`
- **Usage** : Sous-sections, sous-titres dans les cartes
- **Exemple** : `<h3 className="text-xl font-semibold text-foreground">Article 1.1</h3>`

#### H4 - Titre de sous-section

- **Classe Tailwind** : `text-lg font-semibold`
- **Taille** : `1.125rem` (18px)
- **Poids** : `600` (semibold)
- **Couleur** : `text-foreground`
- **Usage** : Titres de sous-sections, listes
- **Exemple** : `<h4 className="text-lg font-semibold text-foreground">Prescriptions</h4>`

### Texte normal

- **Classe Tailwind** : `text-base text-foreground leading-relaxed`
- **Taille** : `1rem` (16px)
- **Poids** : `400` (normal)
- **Line-height** : `1.75` (relaxed)
- **Couleur** : `text-foreground`
- **Usage** : Corps de texte, paragraphes, descriptions

### Petites légendes / Aides

- **Classe Tailwind** : `text-sm text-muted-foreground`
- **Taille** : `0.875rem` (14px)
- **Poids** : `400` (normal)
- **Couleur** : `text-muted-foreground`
- **Usage** : Légendes, textes d'aide, sous-titres de cartes, métadonnées

### Police de caractères

Redyce utilise la police système par défaut :

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-feature-settings: "rlig" 1, "calt" 1;
```

---

## 🧩 Composants UI

### Button (Bouton)

Le composant Button est disponible en plusieurs variantes :

#### Variantes

- **`default`** : Bouton principal (bleu foncé)
  - Classes : `bg-primary text-primary-foreground hover:bg-primary/90`
  - Usage : Actions principales
- **`accent`** : Bouton accent (fond bleu clair)
  - Classes : `bg-accent text-accent-foreground`
  - Usage : Actions secondaires importantes
- **`outline`** : Bouton avec bordure
  - Classes : `border border-border bg-card hover:bg-accent`
  - Usage : Actions secondaires
- **`ghost`** : Bouton transparent
  - Classes : `hover:bg-accent hover:text-accent-foreground`
  - Usage : Actions subtiles
- **`destructive`** : Bouton de danger
  - Classes : `bg-destructive text-destructive-foreground`
  - Usage : Actions destructives (supprimer, etc.)

#### Tailles

- **`default`** : `h-10 px-4 py-2`
- **`sm`** : `h-9 px-3 text-sm`
- **`lg`** : `h-11 px-8 text-base`
- **`icon`** : `h-10 w-10` (carré)

#### Exemple

```tsx
<Button variant="default" size="default">
  Créer un projet
</Button>
```

### Card (Carte)

Composant de conteneur pour regrouper du contenu.

- **Classes** : `rounded-lg border border-border bg-card text-card-foreground shadow-sm`
- **Composants** :
  - `CardHeader` : En-tête avec padding `p-6`
  - `CardTitle` : Titre de carte (`text-xl font-semibold`)
  - `CardDescription` : Description (`text-sm text-muted-foreground`)
  - `CardContent` : Contenu (`p-6 pt-0`)
  - `CardFooter` : Pied de carte (`flex items-center p-6 pt-0`)

#### Exemple

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenu</p>
  </CardContent>
</Card>
```

### Badge (Badge)

Étiquettes pour afficher des statuts, types, catégories.

#### Variantes

- **`default`** : Badge principal (`bg-primary text-primary-foreground`)
- **`secondary`** : Badge secondaire (`bg-secondary text-secondary-foreground`)
- **`accent`** : Badge accent (`bg-accent text-accent-foreground`)
- **`destructive`** : Badge danger (`bg-destructive text-destructive-foreground`)
- **`outline`** : Badge avec bordure (`border-border text-foreground bg-card`)

#### Exemple

```tsx
<Badge variant="secondary">Rénovation</Badge>
<Badge variant="accent">Validé</Badge>
```

### Input (Champ de saisie)

Champ de saisie de texte avec styles harmonisés.

- **Classes** : `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring`

#### Exemple

```tsx
<Input type="email" placeholder="votre@email.com" />
```

### Textarea (Zone de texte)

Zone de texte multiligne.

- **Classes** : Similaires à Input, avec `min-h-[80px]` et `resize-none`

#### Exemple

```tsx
<Textarea placeholder="Votre message..." />
```

---

## 📏 Grille et espacement

### Système de grille

Redyce utilise un système de grille responsive basé sur Tailwind CSS.

#### Breakpoints

- **sm** : `640px` (mobile landscape)
- **md** : `768px` (tablet)
- **lg** : `1024px` (desktop)
- **xl** : `1280px` (large desktop)
- **2xl** : `1400px` (extra large)

#### Exemples de grilles

```tsx
{/* 1 colonne mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### Espacement

Redyce utilise une échelle d'espacement basée sur **4px** (0.25rem).

#### Échelle standard

- **xs** : `0.5rem` (8px) - `gap-2`, `p-2`
- **sm** : `0.75rem` (12px) - `gap-3`, `p-3`
- **md** : `1rem` (16px) - `gap-4`, `p-4` (standard)
- **lg** : `1.5rem` (24px) - `gap-6`, `p-6`
- **xl** : `2rem` (32px) - `gap-8`, `p-8`

#### Utilisation

- **Padding** : `p-4`, `px-6`, `py-3`, etc.
- **Margin** : `m-4`, `mt-2`, `mb-6`, etc.
- **Gap** : `gap-4`, `gap-x-6`, `gap-y-2`, etc.
- **Space** : `space-y-4`, `space-x-2`, etc.

#### Recommandations

- **Conteneurs** : `p-4` à `p-6` pour les cartes
- **Espacement entre sections** : `space-y-6` à `space-y-8`
- **Espacement entre éléments** : `gap-4` à `gap-6`
- **Padding interne** : `p-3` à `p-4` pour les éléments internes

---

## 🎭 Comportements interactifs

### Transitions

Tous les éléments interactifs utilisent des transitions fluides.

#### Durées standard

- **Rapide** : `transition-colors` (150ms par défaut)
- **Moyen** : `transition-all duration-300` (300ms)
- **Lent** : `duration-500` (500ms)

#### Exemples

```tsx
{/* Hover simple */}
<button className="hover:bg-accent transition-colors">

{/* Hover avec scale */}
<div className="hover:scale-105 transition-transform duration-300">

{/* Hover avec shadow */}
<Card className="hover:shadow-lg transition-shadow">
```

### États hover

#### Boutons

- **Primary** : `hover:bg-primary/90`
- **Outline** : `hover:bg-accent hover:text-accent-foreground`
- **Ghost** : `hover:bg-accent`

#### Cartes

- **Hover** : `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`

#### Liens

- **Hover** : `hover:text-primary transition-colors`

### Focus states

Tous les éléments focusables doivent avoir un état de focus visible.

- **Ring** : `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Couleur du ring** : `--ring: 236 62% 22%` (primary)

### Animations

Redyce utilise des animations subtiles pour améliorer l'UX.

#### Animations Framer Motion

- **Entrée** : `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- **Sortie** : `exit={{ opacity: 0, scale: 0.95 }}`
- **Stagger** : `transition={{ delay: index * 0.05 }}`

#### Animations Tailwind

- **Spin** : `animate-spin` (loaders)
- **Pulse** : `animate-pulse` (loading states)

---

## ✅ Bonnes pratiques design

### Contraste et accessibilité

- **Contraste minimum** : Respecter WCAG AA (4.5:1 pour le texte normal)
- **Focus visible** : Toujours afficher un état de focus clair
- **Tailles cliquables** : Minimum 44x44px pour les éléments interactifs

### Responsive design

- **Mobile-first** : Commencer par le design mobile, puis adapter pour desktop
- **Breakpoints** : Utiliser les breakpoints Tailwind (`sm:`, `md:`, `lg:`, etc.)
- **Grilles flexibles** : Utiliser `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### États vides (Empty states)

- **Illustration** : Utiliser une icône ou illustration claire
- **Titre explicite** : Expliquer clairement l'état vide
- **Action CTA** : Proposer une action claire pour résoudre l'état vide

### Feedback utilisateur

- **Loading states** : Afficher des spinners ou skeletons pendant le chargement
- **Success states** : Afficher des confirmations visuelles (toasts, badges)
- **Error states** : Afficher des messages d'erreur clairs et actionnables

### Hiérarchie visuelle

- **Titres** : Utiliser la hiérarchie H1 → H2 → H3
- **Espacement** : Créer une hiérarchie avec l'espacement (plus d'espace = plus important)
- **Couleurs** : Utiliser les couleurs pour créer de la hiérarchie (primary pour l'important)

### Cohérence

- **Composants** : Toujours utiliser les composants UI du design system
- **Espacement** : Respecter l'échelle d'espacement (4px)
- **Couleurs** : Utiliser les variables CSS, jamais de couleurs hardcodées
- **Typographie** : Respecter la hiérarchie typographique

---

## 📚 Ressources

### Fichiers clés

- **Variables CSS** : `src/app/globals.css`
- **Configuration Tailwind** : `tailwind.config.ts`
- **Composants UI** : `src/components/ui/`

### Références externes

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Dernière mise à jour** : Décembre 2024  
**Version du design system** : 1.0

