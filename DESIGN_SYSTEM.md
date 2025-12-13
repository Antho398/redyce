# Design System Redyce - Documentation Officielle

> **Système de design complet pour Redyce**  
> Version 1.0 • Décembre 2024

---

## 📋 Table des matières

1. [Logo](#logo)
2. [Palette de couleurs](#palette-de-couleurs)
3. [Typographie](#typographie)
4. [Espacements](#espacements)
5. [Border Radius](#border-radius)
6. [Ombres](#ombres)
7. [Composants UI](#composants-ui)
8. [Règles d'utilisation](#règles-dutilisation)

---

## 🎨 Logo

### Versions disponibles

#### Version icône seule
- **Fichier** : `/public/logo.svg`
- **Dimensions** : 32x32px
- **Usage** : Favicon, icônes d'application, petits espaces
- **Code SVG** : Disponible dans `/public/logo.svg`

#### Version complète (texte)
- **Fichier** : `/public/logo-full.svg`
- **Dimensions** : 120x32px
- **Usage** : Headers, landing pages, documents officiels
- **Code SVG** : Disponible dans `/public/logo-full.svg`

### Intégration

```tsx
// Version icône seule
<Image src="/logo.svg" alt="Redyce" width={32} height={32} />

// Version complète
<Image src="/logo-full.svg" alt="Redyce" width={120} height={32} />
```

### Règles d'utilisation

- ✅ **Zone de protection** : Minimum 8px autour du logo
- ✅ **Tailles minimum** : 
  - Icône seule : 24x24px
  - Version complète : 80x24px
- ✅ **Fond** : Logo fonctionne sur fond blanc ou `#f5f6fb`
- ❌ **Ne pas modifier** : Couleurs, proportions, espacements

---

## 🎨 Palette de couleurs

### Couleurs principales

#### Primary (Couleur principale)

```css
--primary: #151959
--primary-hover: #1c2270
```

- **Usage** : Boutons principaux, liens actifs, éléments d'action primaires
- **Foreground** : `#FFFFFF` (blanc)

**Classes Tailwind** :
```tsx
bg-[#151959] text-white
hover:bg-[#1c2270]
```

#### Accent (Accent)

```css
--accent: #E3E7FF
```

- **Usage** : Fonds d'accent, états hover légers, highlights
- **Foreground** : `#151959` (primary)

**Classes Tailwind** :
```tsx
bg-[#E3E7FF] text-[#151959]
```

#### Background (Arrière-plan)

```css
--background: #f5f6fb
--sidebar-bg: #f8f9fd
```

- **Usage** : Fond général de l'interface, fond sidebar

**Classes Tailwind** :
```tsx
bg-[#f5f6fb]
bg-[#f8f9fd]
```

#### Foreground (Texte principal)

```css
--foreground: #151959
--foreground-secondary: #64748b
--foreground-muted: #94a3b8
```

- **Usage** : Textes principaux, textes secondaires, placeholders

**Classes Tailwind** :
```tsx
text-[#151959]      /* Texte principal */
text-[#64748b]      /* Texte secondaire */
text-[#94a3b8]      /* Texte muted/placeholder */
```

#### Border (Bordures)

```css
--border: #E5E7EB
--border-subtle: rgba(229, 231, 235, 0.5)
```

- **Usage** : Bordures des éléments, séparateurs

**Classes Tailwind** :
```tsx
border-[#E5E7EB]
border-border/50    /* Bordure subtile */
```

#### Destructive (Danger)

```css
--destructive: #DC2626
```

- **Usage** : Actions destructives, messages d'erreur
- **Foreground** : `#FFFFFF`

**Classes Tailwind** :
```tsx
bg-[#DC2626] text-white
```

### Palette complète

| Couleur | Hex | Usage | Classes Tailwind |
|---------|-----|-------|------------------|
| Primary | `#151959` | Actions principales | `bg-[#151959]`, `text-[#151959]` |
| Primary Hover | `#1c2270` | Hover primary | `hover:bg-[#1c2270]` |
| Accent | `#E3E7FF` | Fonds d'accent | `bg-[#E3E7FF]` |
| Background | `#f5f6fb` | Fond interface | `bg-[#f5f6fb]` |
| Sidebar BG | `#f8f9fd` | Fond sidebar | `bg-[#f8f9fd]` |
| Card | `#FFFFFF` | Fond cartes | `bg-white` |
| Text Primary | `#151959` | Texte principal | `text-[#151959]` |
| Text Secondary | `#64748b` | Texte secondaire | `text-[#64748b]` |
| Text Muted | `#94a3b8` | Placeholders | `text-[#94a3b8]` |
| Border | `#E5E7EB` | Bordures | `border-[#E5E7EB]` |
| Destructive | `#DC2626` | Erreurs | `bg-[#DC2626]` |

### Dégradés (optionnels)

Aucun dégradé standard pour l'instant. Garder les couleurs unies pour un style plus moderne et épuré.

---

## 📝 Typographie

### Hiérarchie

#### H1 - Titre Principal

```css
font-size: 2.25rem;  /* 36px */
font-weight: 700;    /* bold */
line-height: 1.2;
letter-spacing: -0.025em;
color: #151959;
```

**Classes Tailwind** :
```tsx
className="text-4xl font-bold tracking-tight text-[#151959]"
```

**Usage** : Titres de pages principales

#### H2 - Titre de Section

```css
font-size: 1.5rem;   /* 24px */
font-weight: 600;    /* semibold */
line-height: 1.3;
color: #151959;
```

**Classes Tailwind** :
```tsx
className="text-2xl font-semibold text-[#151959]"
```

**Usage** : Sections dans les pages, titres de cartes importantes

#### H3 - Sous-titre

```css
font-size: 1.25rem;  /* 20px */
font-weight: 600;    /* semibold */
line-height: 1.4;
color: #151959;
```

**Classes Tailwind** :
```tsx
className="text-xl font-semibold text-[#151959]"
```

**Usage** : Sous-sections, sous-titres dans les cartes

#### H4 - Titre mineur

```css
font-size: 1.125rem; /* 18px */
font-weight: 600;    /* semibold */
color: #151959;
```

**Classes Tailwind** :
```tsx
className="text-lg font-semibold text-[#151959]"
```

#### Body (Texte normal)

```css
font-size: 1rem;     /* 16px */
font-weight: 400;    /* normal */
line-height: 1.75;   /* leading-relaxed */
color: #151959;
```

**Classes Tailwind** :
```tsx
className="text-base text-[#151959] leading-relaxed"
```

**Usage** : Corps de texte, paragraphes

#### Small (Petit texte)

```css
font-size: 0.875rem; /* 14px */
font-weight: 400;
color: #64748b;
```

**Classes Tailwind** :
```tsx
className="text-sm text-[#64748b]"
```

**Usage** : Légendes, textes d'aide, métadonnées

### Police

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-feature-settings: "rlig" 1, "calt" 1;
```

---

## 📏 Espacements

### Échelle d'espacement

Redyce utilise une échelle basée sur **4px** (0.25rem).

| Nom | Valeur | Classe Tailwind | Usage |
|-----|--------|----------------|-------|
| xs | 0.5rem (8px) | `p-2`, `gap-2`, `space-y-2` | Espacement minimal |
| sm | 0.75rem (12px) | `p-3`, `gap-3`, `space-y-3` | Petits espaces |
| md | 1rem (16px) | `p-4`, `gap-4`, `space-y-4` | Espacement standard |
| lg | 1.5rem (24px) | `p-6`, `gap-6`, `space-y-6` | Grands espaces |
| xl | 2rem (32px) | `p-8`, `gap-8`, `space-y-8` | Très grands espaces |
| 2xl | 3rem (48px) | `p-12`, `gap-12`, `space-y-12` | Espacements exceptionnels |

### Règles d'espacement

#### Sections

- **Espacement entre sections** : `space-y-6` ou `space-y-8`
- **Padding interne section** : `p-6` ou `p-8`

```tsx
<div className="space-y-6">
  <Section1 />
  <Section2 />
</div>
```

#### Cartes

- **Padding interne** : `p-6`
- **Header** : `p-6` (avec `pb-4` pour CardHeader)
- **Content** : `p-6 pt-0` (CardContent)
- **Espacement entre cartes** : `gap-6`

#### Formulaires

- **Espacement entre champs** : `space-y-4`
- **Padding du conteneur** : `p-6`

#### Grilles

- **Gap standard** : `gap-4` ou `gap-6`
- **Gap serré** : `gap-2` ou `gap-3`

---

## 🔲 Border Radius

### Valeurs

| Nom | Valeur | Classe Tailwind | Usage |
|-----|--------|----------------|-------|
| sm | 4px | `rounded-sm` | Rarement utilisé |
| md | 6px | `rounded-md` | Rarement utilisé (ancien style) |
| lg | 8px | `rounded-lg` | Rarement utilisé (ancien style) |
| **xl** | **12px** | **`rounded-xl`** | **Standard Redyce** |

### Règles

- ✅ **Cartes** : Toujours `rounded-xl` (12px)
- ✅ **Boutons** : Toujours `rounded-xl` (12px)
- ✅ **Inputs/Textareas** : Toujours `rounded-xl` (12px)
- ✅ **Selects** : Toujours `rounded-xl` (12px)
- ✅ **Badges** : Toujours `rounded-full`
- ✅ **Avatar** : Toujours `rounded-full`

**Exception** : Les badges utilisent `rounded-full` pour un style plus moderne.

---

## 🌑 Ombres

### Niveaux

#### Shadow Standard (sm)

```css
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
```

**Classe Tailwind** :
```tsx
className="shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
```

**Usage** : Cartes par défaut, éléments statiques

#### Shadow Hover (md)

```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```

**Classe Tailwind** :
```tsx
className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
```

**Usage** : Hover sur cartes, éléments interactifs

#### Shadow Large (lg)

```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

**Classe Tailwind** :
```tsx
className="shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
```

**Usage** : Modales, éléments élevés, hover intensifié

### Règles

- ✅ **Cartes par défaut** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`
- ✅ **Hover sur cartes** : `hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]` ou `hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]`
- ✅ **Header/Topbar** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`
- ✅ **Sidebar** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]` (optionnel)
- ❌ **Éviter les ombres trop prononcées** : Garder un style doux et moderne

---

## 🧩 Composants UI

### Button

#### Variantes

```tsx
// Primary (par défaut)
<Button variant="default">Action principale</Button>

// Outline
<Button variant="outline">Action secondaire</Button>

// Ghost
<Button variant="ghost">Action subtile</Button>

// Destructive
<Button variant="destructive">Supprimer</Button>
```

#### Tailles

```tsx
<Button size="sm">Petit</Button>
<Button size="default">Standard</Button>
<Button size="lg">Grand</Button>
<Button size="icon"><Icon /></Button>
```

**Style** : `rounded-xl`, ombre douce, transition `duration-200`

### Card

```tsx
<Card className="rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50 bg-white">
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenu</p>
  </CardContent>
</Card>
```

**Style** : `rounded-xl`, fond blanc, bordure subtile, ombre douce

### Input

```tsx
<Input 
  className="rounded-xl border-border/50 bg-white focus-visible:border-[#151959]"
  placeholder="Votre texte..."
/>
```

**Style** : `rounded-xl`, fond blanc, bordure subtile, focus `#151959`

### Badge

```tsx
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

**Style** : `rounded-full`

---

## 📐 Règles d'utilisation

### Cartes

- ✅ **Border radius** : `rounded-xl`
- ✅ **Fond** : `bg-white`
- ✅ **Bordure** : `border-border/50`
- ✅ **Ombre** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`
- ✅ **Padding** : `p-6`

### Listes

- ✅ **Espacement entre items** : `gap-3` ou `gap-4`
- ✅ **Hover** : Fond `#f8f9fd`
- ✅ **Padding items** : `p-4`

### Boutons

- ✅ **Border radius** : `rounded-xl`
- ✅ **Transition** : `transition-all duration-200`
- ✅ **Primary** : `bg-[#151959]` avec hover `#1c2270`
- ✅ **Ombre** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`

### Formulaires

- ✅ **Espacement entre champs** : `space-y-4`
- ✅ **Inputs** : `rounded-xl`, fond blanc
- ✅ **Labels** : `text-[#151959] font-medium`
- ✅ **Erreurs** : `text-[#DC2626]`

### États

- ✅ **Loading** : Spinner avec `text-[#151959]`
- ✅ **Erreur** : `text-[#DC2626]` avec icône AlertCircle
- ✅ **Succès** : Badge vert avec CheckCircle2
- ✅ **Désactivé** : `opacity-50`

---

## ✅ Bonnes pratiques

### Couleurs

- ✅ **Toujours utiliser les valeurs hex** : `bg-[#151959]`, `text-[#64748b]`
- ✅ **Ou utiliser les classes Tailwind standard** si configurées : `bg-primary`, `text-muted-foreground`
- ❌ **Ne jamais hardcoder des couleurs arbitraires**

### Espacement

- ✅ **Utiliser l'échelle standard** : `p-4`, `gap-6`, `space-y-4`
- ✅ **Cohérence** : Même espacement dans des contextes similaires
- ❌ **Éviter les valeurs arbitraires** : Pas de `p-[13px]` ou `gap-5.5`

### Border Radius

- ✅ **Toujours `rounded-xl`** pour cartes, boutons, inputs
- ✅ **`rounded-full`** uniquement pour badges et avatars

### Ombres

- ✅ **Ombre douce par défaut** : `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`
- ✅ **Hover avec ombre légèrement plus prononcée**
- ❌ **Éviter les ombres trop fortes**

### Typographie

- ✅ **Respecter la hiérarchie** : H1 → H2 → H3 → Body → Small
- ✅ **Couleurs** : `#151959` pour titres, `#64748b` pour textes secondaires
- ✅ **Font weights** : Bold (700) pour titres, Medium (500-600) pour sous-titres

---

## 📚 Références

### Fichiers clés

- **Variables CSS** : `src/app/globals.css`
- **Configuration Tailwind** : `tailwind.config.ts`
- **Composants UI** : `src/components/ui/`
- **Logo SVG** : `/public/logo.svg`, `/public/logo-full.svg`

### Références externes

- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Style** : Modern SaaS Premium  
**Palette** : Primary #151959

