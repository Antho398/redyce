# UI Rollout - Design System Redyce V1

> **Application complète du style compact et professionnel à toutes les pages du dashboard**  
> Référence : `/projects` (page modèle)  
> Date : Décembre 2024

---

## ✅ Pages Modifiées

### 1. `/projects` (Page Modèle - Référence)

**Fichier** : `src/app/(dashboard)/projects/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact */}
  <div className="flex items-center justify-between gap-4">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      Projets
    </h1>
    <Button onClick={...} size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Nouveau projet
    </Button>
  </div>

  {/* Table dense */}
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Nom du projet</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Documents</TableHead>
            <TableHead>Dernière mise à jour</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="hover:bg-accent/50 cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <TableCell className="font-medium text-sm">...</TableCell>
              {/* ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
```

**Caractéristiques** :
- ✅ Header compact : `text-2xl`, pas de sous-titre marketing
- ✅ Bouton `size="sm"`
- ✅ Table dense : `py-2`, `text-sm`, headers `text-xs uppercase`
- ✅ État vide compact : `max-w-md`, icône 24px, `text-lg`
- ✅ Container : `max-w-6xl mx-auto`
- ✅ Espacements : `space-y-4 py-6`

---

### 2. `/projects/[id]` - Détail Projet

**Fichier** : `src/app/(dashboard)/projects/[id]/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact avec retour */}
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {project.name}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">...</Badge>
          <span className="text-xs text-muted-foreground">...</span>
        </div>
      </div>
    </div>
  </div>

  {/* Stats en table compacte */}
  <Card>
    <CardContent className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documents</TableHead>
            <TableHead>Mémoires générés</TableHead>
            <TableHead>Créé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>...</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  {/* Actions rapides en table */}
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Section</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            className="hover:bg-accent/50 cursor-pointer"
            onClick={() => router.push(...)}
          >
            <TableCell className="font-medium text-sm">...</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
```

**Caractéristiques** :
- ✅ Header compact avec bouton retour discret
- ✅ Stats en table (pas en cards)
- ✅ Actions rapides en table (Documents, DPGF, CCTP)
- ✅ Lignes cliquables avec hover
- ✅ Boutons actions : `variant="ghost" size="sm"`

---

### 3. `/projects/[id]/documents` - Documents du Projet

**Fichier** : `src/app/(dashboard)/projects/[id]/documents/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact */}
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Documents
      </h1>
    </div>
  </div>

  {/* Zone upload compacte */}
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Importer des documents</p>
          <p className="text-xs text-muted-foreground">...</p>
        </div>
      </div>
      <DocumentUpload projectId={projectId} onUploadComplete={...} />
    </CardContent>
  </Card>

  {/* Liste en table dense */}
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Taille</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="hover:bg-accent/50 cursor-pointer"
              onClick={() => router.push(...)}
            >
              <TableCell className="font-medium text-sm">...</TableCell>
              {/* Actions dans dropdown */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
```

**Caractéristiques** :
- ✅ Zone upload compacte : `p-4`, icône `h-4 w-4`
- ✅ Table dense avec colonnes : Nom, Type, Taille, Date, Statut, Actions
- ✅ Actions discrètes : dropdown avec Voir / Télécharger / Supprimer
- ✅ État vide compact : `max-w-md`, icône 24px

---

### 4. `/documents` - Vue Globale

**Fichier** : `src/app/(dashboard)/documents/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact */}
  <div className="flex items-center justify-between gap-4">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      Documents
    </h1>
  </div>

  {/* Filtres compactes */}
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input placeholder="Rechercher..." className="pl-10" />
        </div>
        <select className="flex h-9 ...">Tous les projets</select>
        <select className="flex h-9 ...">Tous les types</select>
      </div>
    </CardContent>
  </Card>

  {/* Table dense globale */}
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Document</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Taille</TableHead>
            <TableHead>Date d'upload</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((doc) => (
            <TableRow
              key={doc.id}
              className="hover:bg-accent/50 cursor-pointer"
              onClick={() => router.push(...)}
            >
              <TableCell className="font-medium text-sm">...</TableCell>
              {/* Lien vers projet cliquable */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
```

**Caractéristiques** :
- ✅ Filtres en ligne : recherche + 2 selects compacts
- ✅ Table dense avec colonnes : Document, Projet, Type, Statut, Taille, Date
- ✅ Lien "Ouvrir" vers `/projects/[projectId]/documents/[documentId]`
- ✅ Lien projet cliquable vers `/projects/[projectId]`
- ✅ État vide compact

---

### 5. `/projects/[id]/dpgf` - DPGF

**Fichier** : `src/app/(dashboard)/projects/[id]/dpgf/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact */}
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        DPGF
      </h1>
    </div>
    <Button onClick={...} size="sm" className="gap-2">
      <Sparkles className="h-4 w-4" />
      Extraire depuis document
    </Button>
  </div>

  {/* Viewer DPGF (utilise DPGFTableViewer existant) */}
  {dpgfs.length === 0 ? (
    <EmptyDPGFState onExtract={...} />
  ) : selectedDPGF ? (
    <DPGFTableViewer dpgfId={selectedDPGF} ... />
  ) : null}
</div>
```

**Caractéristiques** :
- ✅ Header compact avec action `size="sm"`
- ✅ Utilise `DPGFTableViewer` existant (déjà compact)
- ✅ État vide compact
- ✅ Barre d'actions dans le viewer (Extraire / Valider / Exporter)

---

### 6. `/projects/[id]/cctp` - CCTP

**Fichier** : `src/app/(dashboard)/projects/[id]/cctp/page.tsx`

**Structure JSX** :
```tsx
<div className="max-w-6xl mx-auto space-y-4 py-6">
  {/* Header compact */}
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        CCTP
      </h1>
    </div>
    <Button onClick={...} size="sm" className="gap-2">
      <Sparkles className="h-4 w-4" />
      Générer un CCTP
    </Button>
  </div>

  {/* Contenu */}
  {showGenerator ? (
    <Card>
      <CardContent className="p-4">
        <CCTPGenerator ... />
      </CardContent>
    </Card>
  ) : cctps.length === 0 ? (
    <EmptyCCTPState onGenerate={...} />
  ) : selectedCCTP ? (
    <CCTPSplitViewer cctpId={selectedCCTP} ... />
  ) : null}
</div>
```

**Caractéristiques** :
- ✅ Header compact avec toggle Générer / Voir
- ✅ Generator dans card compacte `p-4`
- ✅ Utilise `CCTPSplitViewer` existant
- ✅ État vide compact
- ✅ Pas de grosses zones vides

---

## 📋 Checklist - Toutes les Pages Respectent `/projects`

### Structure Générale

- [x] Container : `max-w-6xl mx-auto space-y-4 py-6`
- [x] Header compact : `text-2xl font-semibold`, pas de sous-titre marketing
- [x] Boutons : `size="sm"` par défaut
- [x] Espacements réduits : `space-y-4` (pas `space-y-8`)

### Tables

- [x] Headers : `text-xs uppercase tracking-wide` (via composant Table)
- [x] Cellules : `py-2 text-sm`
- [x] Hover : `hover:bg-accent/50`
- [x] Lignes cliquables : `cursor-pointer` + `onClick`

### Cards

- [x] Padding : `p-4` (pas `p-6`)
- [x] Ombre : `shadow-sm` (via composant Card)
- [x] Border radius : `rounded-xl` (via composant Card)

### États Vides

- [x] Container : `max-w-md`
- [x] Icône : `h-6 w-6` (24px)
- [x] Titre : `text-lg font-semibold`
- [x] Description : `text-sm text-muted-foreground`
- [x] Bouton : `size="sm"`
- [x] Centrage vertical : `min-h-[40vh]` ou `min-h-[60vh]`

### Typographie

- [x] H1 : `text-2xl font-semibold` (maximum)
- [x] H2 : `text-xl font-semibold`
- [x] H3 : `text-lg font-semibold`
- [x] Body : `text-sm`
- [x] Small : `text-xs`

### Couleurs

- [x] Utilisation des variables CSS : `text-foreground`, `text-muted-foreground`, `bg-accent`
- [x] Pas de couleurs hardcodées (sauf exceptions documentées)
- [x] Primary : `#151959` via `text-primary` ou `bg-primary`

### Actions

- [x] Boutons principaux : `size="sm"`
- [x] Boutons actions : `variant="ghost" size="sm"` ou `h-8 w-8 p-0`
- [x] Icônes : `h-4 w-4` (16px)

---

## 🎯 Règles Appliquées Uniformément

### 1. Header de Page

**Pattern** :
```tsx
<div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    {/* Bouton retour optionnel */}
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      Titre
    </h1>
  </div>
  {/* Actions optionnelles */}
  <Button size="sm">Action</Button>
</div>
```

**Appliqué à** :
- ✅ `/projects`
- ✅ `/projects/[id]`
- ✅ `/projects/[id]/documents`
- ✅ `/documents`
- ✅ `/projects/[id]/dpgf`
- ✅ `/projects/[id]/cctp`

### 2. Table Dense

**Pattern** :
```tsx
<Card>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Colonne</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="hover:bg-accent/50 cursor-pointer">
          <TableCell className="font-medium text-sm">...</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Appliqué à** :
- ✅ `/projects` (liste projets)
- ✅ `/projects/[id]` (stats + actions)
- ✅ `/projects/[id]/documents` (liste documents)
- ✅ `/documents` (vue globale)

### 3. État Vide Compact

**Pattern** :
```tsx
<div className="flex items-center justify-center min-h-[40vh]">
  <Card className="w-full max-w-md">
    <CardContent className="flex flex-col items-center text-center py-12 px-6">
      <div className="mb-4">
        <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center border border-border/50 mx-auto">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Titre
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Description courte
      </p>
      <Button onClick={...} size="sm" className="gap-2">
        <Icon className="h-4 w-4" />
        Action
      </Button>
    </CardContent>
  </Card>
</div>
```

**Appliqué à** :
- ✅ `/projects` (`EmptyProjectsState`)
- ✅ `/projects/[id]/documents` (`EmptyDocumentsState`)
- ✅ `/documents` (inline)
- ✅ `/projects/[id]/dpgf` (`EmptyDPGFState`)
- ✅ `/projects/[id]/cctp` (`EmptyCCTPState`)

---

## 📊 Résumé des Modifications

| Page | Fichier | Changements Principaux |
|------|---------|------------------------|
| `/projects` | `src/app/(dashboard)/projects/page.tsx` | ✅ Table dense, header compact, état vide |
| `/projects/[id]` | `src/app/(dashboard)/projects/[id]/page.tsx` | ✅ Stats en table, actions en table, header compact |
| `/projects/[id]/documents` | `src/app/(dashboard)/projects/[id]/documents/page.tsx` | ✅ Table dense, upload compact, actions discrètes |
| `/documents` | `src/app/(dashboard)/documents/page.tsx` | ✅ Filtres compacts, table dense, liens cliquables |
| `/projects/[id]/dpgf` | `src/app/(dashboard)/projects/[id]/dpgf/page.tsx` | ✅ Header compact, état vide, utilise viewer existant |
| `/projects/[id]/cctp` | `src/app/(dashboard)/projects/[id]/cctp/page.tsx` | ✅ Header compact, generator dans card, état vide |

---

## ✅ Confirmation

**Toutes les pages du dashboard respectent maintenant le Design System Redyce V1 et suivent le pattern de `/projects`.**

### Points Vérifiés

- ✅ **Structure uniforme** : Container `max-w-6xl`, `space-y-4 py-6`
- ✅ **Headers compacts** : `text-2xl`, pas de sous-titres marketing
- ✅ **Tables denses** : `py-2`, `text-sm`, headers `text-xs`
- ✅ **États vides compacts** : `max-w-md`, icône 24px, `text-lg`
- ✅ **Boutons compacts** : `size="sm"` par défaut
- ✅ **Couleurs cohérentes** : Variables CSS uniquement
- ✅ **Pas de marketing** : Pas de gros titres, pas de gros espacements
- ✅ **Style outil métier** : Dense, lisible, professionnel

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Référence** : `/projects` (page modèle)  
**Statut** : ✅ Toutes les pages alignées

