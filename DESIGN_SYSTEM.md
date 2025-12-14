# Design System Redyce V1

> **Style Compact, Professionnel, Dense et Élégant**  
> Inspiré de Linear, Figma, outils métier modernes  
> Version : 1.0  
> Date : Décembre 2024

---

## 🎨 Palette de Couleurs

### Couleurs Principales

| Rôle | Couleur | HEX | HSL | Usage |
|------|---------|-----|-----|-------|
| **Primary** | Bleu foncé | `#151959` | `236 62% 22%` | Boutons principaux, liens actifs, éléments d'action |
| **Primary Foreground** | Blanc | `#FFFFFF` | `0 0% 100%` | Texte sur fond primary |
| **Accent** | Bleu très clair | `#E3E7FF` | `231 100% 95%` | Fonds d'accent, états hover légers, highlights |
| **Background** | Gris très clair | `#F7F8FC` | `228 45% 98%` | Fond général de l'application |
| **Foreground** | Gris foncé | `#111827` | `221 39% 11%` | Texte principal, contenu |
| **Border/Input** | Gris clair | `#E5E7EB` | `220 13% 91%` | Bordures, champs de saisie |
| **Muted Foreground** | Gris moyen | `#9CA3AF` | `218 11% 65%` | Textes secondaires, légendes |
| **Destructive** | Rouge | `#DC2626` | `0 72% 51%` | Actions destructives, erreurs |

### Variables CSS

Toutes les couleurs sont définies via des variables CSS dans `src/app/globals.css` :

```css
--primary: 236 62% 22%;
--primary-foreground: 0 0% 100%;
--accent: 231 100% 95%;
--accent-foreground: 236 62% 22%;
--background: 228 45% 98%;
--foreground: 221 39% 11%;
--border: 220 13% 91%;
--muted-foreground: 218 11% 65%;
--destructive: 0 72% 51%;
```

---

## 📝 Typographie

### Échelle Compacte

| Élément | Classe Tailwind | Taille | Poids | Usage |
|---------|----------------|--------|-------|-------|
| **H1** | `text-2xl font-semibold` | 24px | 600 | Titres de pages principales |
| **H2** | `text-xl font-semibold` | 20px | 600 | Titres de sections |
| **H3** | `text-lg font-medium` | 18px | 500 | Sous-sections, titres dans cartes |
| **H4** | `text-base font-semibold` | 16px | 600 | Titres de sous-sections |
| **Body** | `text-sm` ou `text-base` | 14px / 16px | 400 | Texte normal |
| **Small** | `text-xs` ou `text-sm` | 12px / 14px | 400 | Légendes, textes d'aide |

### Règles

- **Pas de `text-4xl`** ou plus grand dans l'interface (réservé au marketing)
- **`text-2xl` maximum** pour les titres de pages
- **`text-sm` par défaut** pour le contenu normal
- **`font-semibold`** pour les titres (pas `font-bold` sauf exception)

---

## 📏 Densité et Espacement

### Padding

| Élément | Padding | Classe Tailwind |
|---------|---------|-----------------|
| **Card** | 16px / 20px | `p-4` ou `p-5` |
| **CardHeader** | 16px | `p-4` |
| **CardContent** | 16px | `p-4` (pas `p-6` ou plus) |
| **Button** (default) | 12px horizontal | `px-3` ou `px-4` |
| **Input** | 12px horizontal, 8px vertical | `px-3 py-2` |

### Marges

| Contexte | Marge | Classe Tailwind |
|----------|-------|-----------------|
| **Sections** | 24px vertical | `py-6` ou `space-y-6` |
| **Sous-sections** | 16px vertical | `py-4` ou `space-y-4` |
| **Éléments inline** | 8px / 12px | `gap-2` ou `gap-3` |
| **Grid** | 16px | `gap-4` |

### Règles de Densité

- **Éviter `p-6`, `p-8`, `py-12`, `py-16`** sauf cas exceptionnels (empty states centrés)
- **Privilégier `p-4`, `p-5`** pour les cartes
- **Privilégier `space-y-4` ou `space-y-6`** pour les espacements verticaux
- **Pas de grands espaces blancs** inutiles

---

## 🔲 Composants UI

### Button

**Taille par défaut (compacte) :**

```tsx
<Button>Action</Button> // h-9 px-3 text-sm
```

**Tailles disponibles :**

- `size="sm"` : `h-8 px-3 text-xs` - Petits boutons
- `size="default"` : `h-9 px-3 text-sm` - **Par défaut (compact)**
- `size="lg"` : `h-10 px-4 text-sm` - Boutons importants (usage limité)

**Exemple :**

```tsx
<Button size="sm">Petit</Button>
<Button>Normal (compact)</Button>
<Button size="lg">Large</Button>
```

### Card

**Padding réduit :**

```tsx
<Card>
  <CardHeader className="p-4"> {/* Pas p-6 */}
    <CardTitle className="text-lg"> {/* Pas text-xl */}
      Titre
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4"> {/* Pas p-6 */}
    Contenu
  </CardContent>
</Card>
```

**Règles :**

- Border radius : `rounded-xl` (12px)
- Ombre : `shadow-sm` (légère)
- Padding : `p-4` ou `p-5` maximum

### PageHeader

**Titres non oversize :**

```tsx
<PageHeader 
  title="Titre de page" // text-2xl font-semibold (pas text-4xl)
  description="Description compacte" // text-sm
/>
```

**Règles :**

- Titre : `text-2xl font-semibold` (24px, pas 36px)
- Description : `text-sm text-muted-foreground`
- Margin bottom : `mb-4` ou `mb-6`

### Badge

**Texte compact :**

```tsx
<Badge>Texte</Badge> // text-xs par défaut
```

**Règles :**

- Taille de texte : `text-xs` (12px)
- Padding : `px-2.5 py-0.5`
- Border radius : `rounded-full`

### Tabs

**Texte compact :**

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger>Onglet</TabsTrigger> // text-sm
  </TabsList>
</Tabs>
```

**Règles :**

- Taille de texte : `text-sm`
- Hauteur : `h-9` ou `h-10`
- Padding : `px-3 py-1.5`

### Table

**Dense et lisible :**

```tsx
<Table>
  <TableHeader>
    <TableHead className="text-xs uppercase">Colonne</TableHead> {/* text-xs */}
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="py-2 text-sm">Donnée</TableCell> {/* py-2, text-sm */}
    </TableRow>
  </TableBody>
</Table>
```

**Règles :**

- En-têtes : `text-xs uppercase tracking-wide`
- Cellules : `py-2 text-sm`
- Pas de `py-4` ou plus dans les cellules

---

## 🎯 Règles Générales

### Interdictions

❌ **Ne pas utiliser :**
- `text-4xl`, `text-5xl`, `text-6xl` (trop grand, aspect marketing)
- `p-6`, `p-8`, `py-12`, `py-16` (sauf empty states centrés)
- `font-bold` pour les titres (préférer `font-semibold`)
- `shadow-lg`, `shadow-xl` (préférer `shadow-sm`)

✅ **Privilégier :**
- `text-2xl` maximum pour les titres
- `text-sm` pour le contenu normal
- `p-4`, `p-5` pour les cartes
- `shadow-sm` pour les ombres
- `font-semibold` pour les titres

### Cohérence

- **Toutes les pages** doivent utiliser ces règles
- **Tous les composants** doivent être compacts par défaut
- **Harmonisation** : même densité partout dans l'application

---

## 📐 Exemples JSX

### Page Typique

```tsx
<div className="space-y-4">
  {/* Header compact */}
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-[#151959]">
        Titre de page
      </h1>
      <p className="text-sm text-[#64748b]">
        Description courte
      </p>
    </div>
    <Button size="sm">Action</Button>
  </div>

  {/* Card compacte */}
  <Card>
    <CardHeader className="p-4">
      <CardTitle className="text-lg">Titre carte</CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <p className="text-sm">Contenu dense</p>
    </CardContent>
  </Card>
</div>
```

### Tableau Dense

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-xs font-semibold uppercase tracking-wide">
        Colonne
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="py-2 text-sm">
        Donnée
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### État Vide Compact

```tsx
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-4">
      <div className="h-8 w-8 rounded-lg bg-[#f8f9fd] flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#64748b]" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-[#151959] mb-2">
      Aucun élément
    </h3>
    <p className="text-sm text-[#64748b] mb-5">
      Description courte
    </p>
    <Button size="sm">Action</Button>
  </CardContent>
</Card>
```

---

## ✅ Checklist Application

Pour garantir l'application du Design System :

- [ ] Tous les titres H1 sont en `text-2xl` (pas `text-4xl`)
- [ ] Toutes les cartes utilisent `p-4` ou `p-5` (pas `p-6+`)
- [ ] Tous les boutons par défaut sont compacts (`h-9`)
- [ ] Tous les tableaux ont des en-têtes `text-xs` et cellules `py-2`
- [ ] Tous les badges et tabs utilisent `text-xs` ou `text-sm`
- [ ] Toutes les pages utilisent `space-y-4` ou `space-y-6` pour les sections
- [ ] Pas d'ombres lourdes (`shadow-lg`, `shadow-xl`)
- [ ] Cohérence des couleurs (utilisation des variables CSS)

---

**Version** : 1.0  
**Dernière mise à jour** : Décembre 2024  
**Style** : Compact, Professionnel, Dense, Élégant
