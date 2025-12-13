# Redyce Design System - Guide Complet

> **Référence officielle du design system Redyce**  
> Style : Modern SaaS (Stripe / Linear / Vercel)  
> Dernière mise à jour : Décembre 2024

---

## 📋 Table des matières

1. [Philosophie](#philosophie)
2. [Palette de couleurs](#palette-de-couleurs)
3. [Typographie](#typographie)
4. [Espacement](#espacement)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Composants UI](#composants-ui)
8. [Exemples d'utilisation](#exemples-dutilisation)
9. [Bonnes pratiques](#bonnes-pratiques)

---

## 🎯 Philosophie

Le design system Redyce s'inspire des meilleures pratiques SaaS modernes (Stripe, Linear, Vercel) :

- **Simplicité** : Interface claire et épurée
- **Cohérence** : Utilisation systématique des composants et couleurs
- **Performance** : Animations subtiles et transitions fluides
- **Accessibilité** : Contraste suffisant et états focus clairs
- **Responsive** : Mobile-first, adaptable à tous les écrans

---

## 🎨 Palette de couleurs

### Couleurs principales

Toutes les couleurs sont définies dans `src/app/globals.css` via des variables CSS HSL.

#### Primary (Couleur principale)

- **Couleur** : `#151959` (Bleu foncé)
- **HSL** : `236 62% 22%`
- **Foreground** : `#FFFFFF` (Blanc) - `0 0% 100%`
- **Usage** : Boutons principaux, liens actifs, éléments d'action primaires
- **Classes Tailwind** : `bg-primary`, `text-primary-foreground`, `border-primary`

```tsx
<Button variant="default">Action principale</Button>
```

#### Accent (Accent)

- **Couleur** : `#E3E7FF` (Bleu très clair)
- **HSL** : `231 100% 95%`
- **Foreground** : `#151959` (Primary)
- **Usage** : Fonds d'accent, états hover légers, highlights
- **Classes Tailwind** : `bg-accent`, `text-accent-foreground`

```tsx
<div className="bg-accent text-accent-foreground">Contenu accent</div>
```

#### Background (Arrière-plan)

- **Couleur** : `#F7F8FC` (Gris très clair)
- **HSL** : `228 45% 98%`
- **Usage** : Fond général de l'application
- **Classes Tailwind** : `bg-background`

#### Foreground (Texte principal)

- **Couleur** : `#111827` (Gris foncé)
- **HSL** : `221 39% 11%`
- **Usage** : Texte principal, titres, contenu
- **Classes Tailwind** : `text-foreground`

#### Border (Bordures)

- **Couleur** : `#E5E7EB` (Gris clair)
- **HSL** : `220 13% 91%`
- **Usage** : Bordures des éléments, séparateurs
- **Classes Tailwind** : `border-border`, `border-input`

#### Muted (Texte secondaire)

- **Couleur** : `#9CA3AF` (Gris moyen)
- **HSL** : `218 11% 65%`
- **Usage** : Textes secondaires, légendes, métadonnées
- **Classes Tailwind** : `text-muted-foreground`

#### Destructive (Danger)

- **Couleur** : `#DC2626` (Rouge)
- **HSL** : `0 72% 51%`
- **Foreground** : `#FFFFFF` (Blanc)
- **Usage** : Actions destructives, messages d'erreur
- **Classes Tailwind** : `bg-destructive`, `text-destructive-foreground`

### Variables CSS

```css
:root {
  --primary: 236 62% 22%;           /* #151959 */
  --primary-foreground: 0 0% 100%;  /* #FFFFFF */
  --accent: 231 100% 95%;           /* #E3E7FF */
  --accent-foreground: 236 62% 22%; /* #151959 */
  --background: 228 45% 98%;        /* #F7F8FC */
  --foreground: 221 39% 11%;        /* #111827 */
  --card: 0 0% 100%;                /* #FFFFFF */
  --card-foreground: 221 39% 11%;   /* #111827 */
  --border: 220 13% 91%;            /* #E5E7EB */
  --input: 220 13% 91%;             /* #E5E7EB */
  --muted-foreground: 218 11% 65%;  /* #9CA3AF */
  --destructive: 0 72% 51%;         /* #DC2626 */
}
```

---

## 📝 Typographie

### Hiérarchie

#### H1 - Titre Principal

- **Classes** : `text-4xl font-bold tracking-tight`
- **Taille** : `2.25rem` (36px)
- **Poids** : `700` (bold)
- **Usage** : Titres de pages principales

```tsx
<h1 className="text-4xl font-bold tracking-tight text-foreground">
  Mes Projets
</h1>
```

#### H2 - Titre de Section

- **Classes** : `text-2xl font-semibold tracking-tight`
- **Taille** : `1.5rem` (24px)
- **Poids** : `600` (semibold)
- **Usage** : Sections principales, titres de cartes

```tsx
<h2 className="text-2xl font-semibold tracking-tight text-foreground">
  Documents existants
</h2>
```

#### H3 - Sous-titre

- **Classes** : `text-xl font-semibold`
- **Taille** : `1.25rem` (20px)
- **Poids** : `600` (semibold)
- **Usage** : Sous-sections, sous-titres

```tsx
<h3 className="text-xl font-semibold text-foreground">
  Article 1.1
</h3>
```

#### H4 - Titre mineur

- **Classes** : `text-lg font-semibold`
- **Taille** : `1.125rem` (18px)
- **Poids** : `600` (semibold)

#### Body (Texte normal)

- **Classes** : `text-base text-foreground leading-relaxed`
- **Taille** : `1rem` (16px)
- **Poids** : `400` (normal)
- **Line-height** : `1.75` (relaxed)

#### Small (Petit texte)

- **Classes** : `text-sm text-muted-foreground`
- **Taille** : `0.875rem` (14px)
- **Usage** : Légendes, textes d'aide, métadonnées

### Police

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-feature-settings: "rlig" 1, "calt" 1;
```

---

## 📏 Espacement

### Échelle d'espacement

Redyce utilise une échelle basée sur **4px** (0.25rem).

| Nom | Valeur | Classe Tailwind | Usage |
|-----|--------|----------------|-------|
| xs | 0.5rem (8px) | `p-2`, `gap-2`, `space-y-2` | Espacement minimal |
| sm | 0.75rem (12px) | `p-3`, `gap-3`, `space-y-3` | Petits espaces |
| md | 1rem (16px) | `p-4`, `gap-4`, `space-y-4` | Espacement standard |
| lg | 1.5rem (24px) | `p-6`, `gap-6`, `space-y-6` | Grands espaces |
| xl | 2rem (32px) | `p-8`, `gap-8`, `space-y-8` | Très grands espaces |

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
- **Espacement entre cartes** : `gap-6`

```tsx
<Card>
  <CardHeader className="p-6">...</CardHeader>
  <CardContent className="p-6">...</CardContent>
</Card>
```

#### Formulaires

- **Espacement entre champs** : `space-y-4`
- **Padding du conteneur** : `p-6`

```tsx
<form className="space-y-4 p-6">
  <Input />
  <Input />
  <Button>Envoyer</Button>
</form>
```

---

## 🔲 Border Radius

### Valeurs

| Nom | Valeur | Classe Tailwind | Usage |
|-----|--------|----------------|-------|
| sm | 4px | `rounded-sm` | Petits éléments |
| md | 6px | `rounded-md` | Boutons, inputs |
| lg | 8px | `rounded-lg` | Cartes (anciennes) |
| xl | 12px | `rounded-xl` | **Cartes (standard Redyce)** |

### Règles

- **Cartes** : `rounded-xl` (12px) - standard pour Redyce
- **Boutons** : `rounded-md` (6px)
- **Inputs** : `rounded-md` (6px)
- **Badges** : `rounded-full`

```tsx
<Card className="rounded-xl">...</Card>
<Button className="rounded-md">...</Button>
```

---

## 🌑 Shadows

### Niveaux

| Nom | Classe Tailwind | Usage |
|-----|----------------|-------|
| sm | `shadow-sm` | **Cartes (standard Redyce)** |
| md | `shadow-md` | Éléments élevés |
| lg | `shadow-lg` | Modales, éléments flottants |

### Règles

- **Cartes par défaut** : `shadow-sm` (ombre douce et subtile)
- **Hover sur cartes** : `hover:shadow-lg` (élévation au survol)
- **Modales** : `shadow-lg` (ombre plus prononcée)

```tsx
<Card className="shadow-sm hover:shadow-lg transition-shadow">
  ...
</Card>
```

---

## 🧩 Composants UI

### Button (Bouton)

#### Variantes

```tsx
// Primary (par défaut)
<Button variant="default">Action principale</Button>

// Accent
<Button variant="accent">Action accent</Button>

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

### Card (Carte)

```tsx
<Card className="rounded-xl shadow-sm">
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenu</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Style standard** : `rounded-xl shadow-sm`

### Input (Champ de saisie)

```tsx
<Input 
  type="email" 
  placeholder="votre@email.com"
  className="rounded-md"
/>
```

**Style** : `rounded-md border-input bg-background`

### Textarea

```tsx
<Textarea 
  placeholder="Votre message..."
  className="rounded-md min-h-[80px]"
/>
```

### Select

```tsx
<Select className="rounded-md">
  <option>Option 1</option>
  <option>Option 2</option>
</Select>
```

### Badge (Badge)

```tsx
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="accent">Accent</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Danger</Badge>
```

**Style** : `rounded-full`

### Table (Tableau)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Colonne 1</TableHead>
      <TableHead>Colonne 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Donnée 1</TableCell>
      <TableCell>Donnée 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs (Onglets)

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Onglet 1</TabsTrigger>
    <TabsTrigger value="tab2">Onglet 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Contenu 1</TabsContent>
  <TabsContent value="tab2">Contenu 2</TabsContent>
</Tabs>
```

---

## 💡 Exemples d'utilisation

### Page standard

```tsx
<div className="space-y-6">
  <PageHeader
    title="Titre de la page"
    description="Description de la page"
    actions={<Button>Action</Button>}
  />
  
  <Card className="rounded-xl shadow-sm">
    <CardHeader>
      <CardTitle>Titre de la carte</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Contenu</p>
    </CardContent>
  </Card>
</div>
```

### Formulaire

```tsx
<Card className="rounded-xl shadow-sm">
  <CardHeader>
    <CardTitle>Formulaire</CardTitle>
    <CardDescription>Remplissez les champs</CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Email
        </label>
        <Input 
          type="email" 
          placeholder="votre@email.com"
          className="rounded-md"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">
          Message
        </label>
        <Textarea 
          placeholder="Votre message..."
          className="rounded-md"
        />
      </div>
      <Button variant="default" className="rounded-md">
        Envoyer
      </Button>
    </form>
  </CardContent>
</Card>
```

### Zone d'upload (Drag & Drop)

```tsx
<Card className="rounded-xl shadow-sm border-2 border-dashed border-border">
  <CardContent className="p-12 text-center">
    <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
    <h3 className="text-lg font-semibold mb-2">
      Glissez-déposez vos fichiers
    </h3>
    <p className="text-sm text-muted-foreground mb-4">
      ou <button className="text-primary hover:underline">parcourez</button>
    </p>
    <p className="text-xs text-muted-foreground">
      Formats supportés: PDF, DOCX, JPEG, PNG
    </p>
  </CardContent>
</Card>
```

### Grille de cartes

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card 
      key={item.id}
      className="rounded-xl shadow-sm hover:shadow-lg transition-shadow"
    >
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{item.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## ✅ Bonnes pratiques

### Couleurs

- ✅ **Toujours utiliser les variables CSS** : `bg-primary`, `text-foreground`, etc.
- ❌ **Ne jamais hardcoder les couleurs** : Pas de `bg-[#151959]` ou `text-gray-900`

### Espacement

- ✅ **Utiliser l'échelle standard** : `p-4`, `gap-6`, `space-y-4`
- ✅ **Cohérence** : Même espacement dans des contextes similaires
- ❌ **Éviter les valeurs arbitraires** : Pas de `p-[13px]` ou `gap-5.5`

### Border Radius

- ✅ **Cartes** : Toujours `rounded-xl` (12px)
- ✅ **Boutons/Inputs** : Toujours `rounded-md` (6px)
- ✅ **Badges** : Toujours `rounded-full`

### Shadows

- ✅ **Cartes par défaut** : `shadow-sm`
- ✅ **Hover** : `hover:shadow-lg` pour l'élévation
- ❌ **Éviter les ombres trop prononcées** : Pas de `shadow-2xl` sauf modales

### Typographie

- ✅ **Respecter la hiérarchie** : H1 → H2 → H3 → Body → Small
- ✅ **Utiliser les classes Tailwind** : `text-4xl font-bold`, etc.
- ❌ **Ne pas créer de nouvelles tailles** : Utiliser l'échelle existante

### Composants

- ✅ **Toujours utiliser les composants UI** : `Button`, `Card`, `Input`, etc.
- ✅ **Respecter les variantes** : Utiliser `variant="default"` pour les actions principales
- ❌ **Ne pas modifier directement les composants UI** : Créer des variantes si nécessaire

### Responsive

- ✅ **Mobile-first** : Commencer par le design mobile
- ✅ **Utiliser les breakpoints** : `md:`, `lg:`, etc.
- ✅ **Tester sur différentes tailles** : Mobile, tablette, desktop

---

## 🎨 Appliquer le design system dans une nouvelle page

### Structure de base

```tsx
'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Titre de la page"
        description="Description de la page"
        actions={<Button>Action principale</Button>}
      />

      {/* Contenu */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Titre de la carte</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenu</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Checklist

- [ ] Utiliser `PageHeader` pour le titre
- [ ] Utiliser `Card` avec `rounded-xl shadow-sm`
- [ ] Utiliser `space-y-6` pour l'espacement entre sections
- [ ] Utiliser les couleurs via variables CSS (`bg-primary`, `text-foreground`, etc.)
- [ ] Respecter la hiérarchie typographique (H1 → H2 → H3)
- [ ] Utiliser les composants UI existants
- [ ] Tester le responsive (mobile, tablette, desktop)

---

## 📚 Ressources

### Fichiers clés

- **Variables CSS** : `src/app/globals.css`
- **Configuration Tailwind** : `tailwind.config.ts`
- **Composants UI** : `src/components/ui/`

### Références externes

- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Stripe Design](https://stripe.com/design)
- [Linear Design](https://linear.app/)

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0  
**Style** : Modern SaaS (Stripe / Linear / Vercel)
