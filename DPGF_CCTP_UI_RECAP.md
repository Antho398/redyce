# Récapitulatif - UI Professionnelle DPGF et CCTP

## ✅ Modifications effectuées

Interfaces métier créées pour les pages DPGF et CCTP avec design Modern SaaS Redyce, optimisées pour des sessions de travail longues.

---

## 📁 Fichiers créés/modifiés

### 1. **DPGF - Page et composant**

#### `src/app/(dashboard)/projects/[id]/dpgf/page.tsx`
- ✅ Page complète avec header et navigation
- ✅ Intégration du nouveau composant `DPGFTableViewer`
- ✅ Gestion des états (loading, erreur, vide)

#### `src/components/dpgf/DPGFTableViewer.tsx` (NOUVEAU)
- ✅ **Tableau structuré professionnel** avec colonnes :
  - Lot, Référence, Désignation, Unité, Quantité, Prix unitaire, Total, Normes, Statut
- ✅ **Header avec actions** :
  - Titre + nom du projet
  - Boutons : "Recalculer", "Exporter", "Envoyer vers CCTP"
- ✅ **Barre d'outils** :
  - Recherche par désignation/référence
  - Filtre par lot
- ✅ **Badges d'états** :
  - "Validé" (vert)
  - "Modifié" (bleu)
  - "À vérifier" (jaune)
- ✅ **Zebra striping** (lignes alternées)
- ✅ **Footer avec total général**
- ✅ Design système Redyce (rounded-xl, shadow-sm, couleurs)

### 2. **CCTP - Page et composant**

#### `src/app/(dashboard)/projects/[id]/cctp/page.tsx`
- ✅ Page complète avec header et navigation
- ✅ Gestion du mode génération/visualisation
- ✅ Intégration du nouveau composant `CCTPSplitViewer`
- ✅ Support du paramètre `dpgfId` dans l'URL

#### `src/components/cctp/CCTPSplitViewer.tsx` (NOUVEAU)
- ✅ **Layout split** :
  - **Gauche** : Sommaire cliquable avec sections/chapitres
  - **Droite** : Contenu éditable de la section sélectionnée
- ✅ **Header avec actions** :
  - Titre CCTP + infos projet
  - Boutons : "Régénérer", "Enregistrer", "Exporter"
- ✅ **Encart "Contexte"** :
  - DPGF source
  - Modèle IA utilisé
  - Dates de création/modification
- ✅ **Navigation par sections** :
  - Détection automatique des titres dans le contenu
  - Scroll automatique vers la section sélectionnée
  - Indentation selon le niveau (H1, H2, etc.)
- ✅ **Éditeur de contenu** :
  - Textarea pour éditer chaque section
  - Hauteur confortable (500px minimum)
  - Police monospace pour la lisibilité
- ✅ Design système Redyce (rounded-xl, shadow-sm, couleurs)

---

## 📝 Extrait JSX principal

### 1. DPGF - Page principale

```tsx
<div className="space-y-6">
  {/* Navigation retour */}
  <Button variant="ghost" onClick={() => router.push(`/projects/${params.id}`)}>
    <ArrowLeft /> Retour au projet
  </Button>

  {/* Header */}
  <PageHeader
    title="DPGF Extraits"
    description={`DPGF structurés pour le projet "${project.name}"`}
    actions={
      <Button onClick={handleExtractFromDocument}>
        <Sparkles /> Extraire depuis document
      </Button>
    }
  />

  {/* Viewer avec tableau */}
  <DPGFTableViewer
    dpgfId={selectedDPGF}
    projectName={project?.name}
    onRefresh={fetchDPGFs}
  />
</div>
```

### 2. DPGF - Composant TableViewer

```tsx
<div className="space-y-6">
  {/* Header avec actions */}
  <Card className="rounded-xl shadow-sm">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle>{dpgf.title}</CardTitle>
          <div>Référence: {dpgf.reference} • Projet: {projectName}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalculate}>
            <RefreshCw /> Recalculer
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download /> Exporter
          </Button>
          <Button variant="default" onClick={handleSendToCCTP}>
            <Send /> Envoyer vers CCTP
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>

  {/* Barre d'outils */}
  <Card className="rounded-xl shadow-sm">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par désignation ou référence..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={filterLot} onChange={(e) => setFilterLot(e.target.value)}>
          <option value="all">Tous les lots</option>
          {lots.map(lot => <option key={lot} value={lot}>{lot}</option>)}
        </select>
      </div>
    </CardContent>
  </Card>

  {/* Tableau structuré */}
  <Card className="rounded-xl shadow-sm">
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lot</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Désignation</TableHead>
            <TableHead className="text-right">Unité</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
            <TableHead className="text-right">Prix unitaire</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Normes</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow
              key={item.id}
              className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
            >
              <TableCell>
                <Badge variant="outline">{item.lot}</Badge>
              </TableCell>
              <TableCell>{item.reference || '—'}</TableCell>
              <TableCell className="font-medium">{item.designation}</TableCell>
              <TableCell className="text-right">{item.unite}</TableCell>
              <TableCell className="text-right">{item.quantite?.toLocaleString('fr-FR')}</TableCell>
              <TableCell className="text-right">{item.prixUnitaire?.toLocaleString('fr-FR')} €</TableCell>
              <TableCell className="text-right font-semibold">
                {item.total?.toLocaleString('fr-FR')} €
              </TableCell>
              <TableCell>
                {item.normes?.map(norme => <Badge key={norme}>{norme}</Badge>)}
              </TableCell>
              <TableCell>{getStatusBadge(item.statut)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Footer avec total */}
      <div className="border-t bg-muted/30 px-4 py-4">
        <div className="flex justify-between">
          <span>{filteredData.length} éléments affichés</span>
          <div>
            <div className="text-sm text-muted-foreground">Total général</div>
            <div className="text-2xl font-bold text-primary">
              {totalGeneral.toLocaleString('fr-FR')} €
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

### 3. CCTP - Page principale

```tsx
<div className="space-y-6">
  {/* Navigation retour */}
  <Button variant="ghost" onClick={() => router.push(`/projects/${params.id}`)}>
    <ArrowLeft /> Retour au projet
  </Button>

  {/* Header */}
  <PageHeader
    title="CCTP Générés"
    description={`Cahiers des Clauses Techniques Particulières pour "${project.name}"`}
    actions={
      <Button onClick={() => setShowGenerator(!showGenerator)}>
        {showGenerator ? <FileCheck /> Voir les CCTP : <Sparkles /> Générer un CCTP}
      </Button>
    }
  />

  {/* Contenu */}
  {showGenerator ? (
    <CCTPGenerator ... />
  ) : selectedCCTP ? (
    <CCTPSplitViewer cctpId={selectedCCTP} projectName={project?.name} />
  ) : null}
</div>
```

### 4. CCTP - Composant SplitViewer

```tsx
<div className="space-y-6">
  {/* Header avec actions */}
  <Card className="rounded-xl shadow-sm">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle>{cctp.title}</CardTitle>
          <div>Version: {cctp.version} • Projet: {projectName}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRegenerate}>
            <RefreshCw /> Régénérer
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save /> Enregistrer
          </Button>
          <Button variant="default" onClick={handleExport}>
            <Download /> Exporter
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>

  {/* Layout split */}
  <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
    {/* Panneau gauche : Sommaire */}
    <Card className="rounded-xl shadow-sm h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>
          <ClipboardList /> Sommaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md',
                selectedSectionId === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent',
                section.level > 1 && 'pl-6 text-xs'
              )}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>

    {/* Panneau droit : Contenu */}
    <Card className="rounded-xl shadow-sm">
      <CardContent>
        <h2>{selectedSection.title}</h2>
        <Textarea
          value={editedContent[selectedSection.id] || selectedSection.content}
          onChange={(e) => setEditedContent({
            ...editedContent,
            [selectedSection.id]: e.target.value
          })}
          className="min-h-[500px] font-mono"
        />
      </CardContent>
    </Card>
  </div>

  {/* Encart contexte */}
  <Card className="rounded-xl shadow-sm bg-accent/30">
    <CardHeader>
      <CardTitle><Building2 /> Contexte et paramètres</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>DPGF source: {cctp.dpgf?.title}</div>
        <div>Modèle IA: {cctp.model}</div>
        <div>Date de création: {new Date(cctp.createdAt).toLocaleDateString('fr-FR')}</div>
        <div>Dernière mise à jour: {new Date(cctp.updatedAt).toLocaleDateString('fr-FR')}</div>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 🔍 Comment filtrer par lot dans le DPGF

Le filtrage par lot dans `DPGFTableViewer` fonctionne ainsi :

### 1. **Extraction des lots uniques**

```tsx
const lots = useMemo(() => {
  const uniqueLots = new Set<string>()
  tableData.forEach((item) => {
    if (item.lot) uniqueLots.add(item.lot)
  })
  return Array.from(uniqueLots).sort()
}, [tableData])
```

Cette fonction :
- Parcourt tous les items du tableau
- Extrait les valeurs uniques du champ `lot`
- Trie les lots par ordre alphabétique
- Retourne un tableau de lots uniques

### 2. **Application du filtre**

```tsx
const filteredData = useMemo(() => {
  return tableData.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLot = filterLot === 'all' || item.lot === filterLot
    return matchesSearch && matchesLot
  })
}, [tableData, searchQuery, filterLot])
```

Le filtrage combine :
- **Recherche textuelle** : dans la désignation ou la référence
- **Filtre par lot** : tous les lots (`filterLot === 'all'`) ou un lot spécifique

### 3. **Interface utilisateur**

```tsx
<select
  value={filterLot}
  onChange={(e) => setFilterLot(e.target.value)}
  className="rounded-md border border-input..."
>
  <option value="all">Tous les lots</option>
  {lots.map((lot) => (
    <option key={lot} value={lot}>
      {lot}
    </option>
  ))}
</select>
```

Le select affiche :
- "Tous les lots" pour réinitialiser le filtre
- Tous les lots uniques extraits du DPGF

### 4. **Affichage dans le tableau**

Chaque ligne affiche le lot dans une badge :

```tsx
<TableCell>
  <Badge variant="outline" className="rounded-full">
    {item.lot}
  </Badge>
</TableCell>
```

### 5. **Feedback visuel**

Le footer du tableau affiche le nombre d'éléments filtrés :

```tsx
<div className="text-sm text-muted-foreground">
  {filteredData.length} élément{filteredData.length > 1 ? 's' : ''} affiché
  {filterLot !== 'all' && ` (filtré par lot: ${filterLot})`}
</div>
```

---

## ✅ Design System appliqué

Toutes les interfaces utilisent :

- ✅ **Couleurs** : Palette Redyce (#151959 primary, #E3E7FF accent)
- ✅ **Border Radius** : `rounded-xl` pour les cartes, `rounded-md` pour les inputs
- ✅ **Shadows** : `shadow-sm` par défaut
- ✅ **Typography** : Hiérarchie claire (H1 → H2 → H3)
- ✅ **Espacement** : `space-y-6` pour les sections, `gap-4`/`gap-6` pour les grilles
- ✅ **Hover states** : Transitions douces sur les éléments interactifs
- ✅ **Zebra striping** : Alternance de couleurs de fond pour les lignes du tableau
- ✅ **Sticky sidebar** : Sommaire fixe lors du scroll (CCTP)

---

## 🎨 Optimisations pour sessions longues

### Lisibilité
- ✅ Hauteur de ligne confortable dans les tableaux
- ✅ Police monospace pour l'édition de code/contenu
- ✅ Espacement généreux entre les éléments
- ✅ Contraste suffisant (texte sur fond)

### Navigation
- ✅ Sommaire cliquable avec scroll automatique (CCTP)
- ✅ Filtres et recherche pour trouver rapidement les éléments (DPGF)
- ✅ Navigation claire entre les sections

### Feedback visuel
- ✅ États de chargement clairs
- ✅ Badges de statut colorés
- ✅ Zebra striping pour suivre les lignes
- ✅ Totaux en évidence

---

**Date** : Décembre 2024  
**Style** : Modern SaaS (Stripe / Linear / Vercel)  
**Palette** : Primary #151959

