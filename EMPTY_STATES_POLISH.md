# Empty States - Polish Final

> **Uniformisation des états vides selon le Design System Redyce V1**  
> Date : Décembre 2024

---

## ✅ Pattern Uniforme Appliqué

### Structure Standard

Tous les empty states suivent maintenant exactement le même pattern :

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
        Description explicative
      </p>
      <Button onClick={...} size="sm" className="gap-2">
        <Icon className="h-4 w-4" />
        Action claire
      </Button>
    </CardContent>
  </Card>
</div>
```

### Caractéristiques

- ✅ **Icône** : `h-6 w-6` (24px) avec icône `h-4 w-4` (16px)
- ✅ **Titre** : `text-lg font-semibold`
- ✅ **Description** : `text-sm text-muted-foreground` (1 phrase max)
- ✅ **Bouton** : `size="sm"` avec icône `h-4 w-4`
- ✅ **Container** : `max-w-md`, `py-12 px-6`
- ✅ **Centrage** : `min-h-[40vh]` (uniformisé)

---

## 📋 États Vides par Page

### 1. `/projects` - Aucun Projet

**Fichier** : `src/app/(dashboard)/projects/page.tsx`

**Composant** : `EmptyProjectsState()`

**Texte** :
- **Titre** : "Aucun projet"
- **Description** : "Créez votre premier projet pour organiser vos documents et générer vos mémoires."
- **Action** : "Créer un projet" → `/projects/new`

**Pourquoi** : L'utilisateur n'a pas encore créé de projet.
**Action suivante** : Créer un projet pour commencer.

---

### 2. `/projects/[id]/documents` - Aucun Document

**Fichier** : `src/app/(dashboard)/projects/[id]/documents/page.tsx`

**Composant** : `EmptyDocumentsState({ projectId })`

**Texte** :
- **Titre** : "Aucun document"
- **Description** : "Importez des documents techniques (PDF, DOCX, images) pour les analyser et extraire des données."
- **Action** : Pas de bouton (zone d'upload visible au-dessus)

**Pourquoi** : Aucun document n'a été importé dans ce projet.
**Action suivante** : Utiliser la zone d'upload au-dessus pour importer des documents.

---

### 3. `/documents` - Aucun Document (Vue Globale)

**Fichier** : `src/app/(dashboard)/documents/page.tsx`

**Composant** : Inline (conditionnel)

**Texte** :
- **Titre** : "Aucun document" ou "Aucun document trouvé"
- **Description** : 
  - Si aucun document : "Créez un projet et importez vos premiers documents pour commencer."
  - Si filtres : "Ajustez vos filtres pour trouver vos documents."
- **Action** : "Créer un projet" → `/projects/new` (si aucun document)

**Pourquoi** : Aucun document n'existe dans tous les projets, ou les filtres ne retournent rien.
**Action suivante** : Créer un projet ou ajuster les filtres.

---

### 4. `/projects/[id]/dpgf` - Aucun DPGF

**Fichier** : `src/app/(dashboard)/projects/[id]/dpgf/page.tsx`

**Composant** : `EmptyDPGFState({ onExtract })`

**Texte** :
- **Titre** : "Aucun DPGF extrait"
- **Description** : "Importez des documents puis extrayez un DPGF pour structurer vos données de prix."
- **Action** : "Extraire un DPGF" → redirige vers `/projects/[id]/documents`

**Pourquoi** : Aucun DPGF n'a été extrait pour ce projet.
**Action suivante** : Importer des documents puis extraire un DPGF.

---

### 5. `/projects/[id]/cctp` - Aucun CCTP

**Fichier** : `src/app/(dashboard)/projects/[id]/cctp/page.tsx`

**Composant** : `EmptyCCTPState({ onGenerate })`

**Texte** :
- **Titre** : "Aucun CCTP généré"
- **Description** : "Générez un CCTP depuis un DPGF validé ou des documents pour créer votre cahier des clauses techniques."
- **Action** : "Générer un CCTP" → ouvre le générateur

**Pourquoi** : Aucun CCTP n'a été généré pour ce projet.
**Action suivante** : Générer un CCTP depuis un DPGF ou des documents.

---

## ✅ Checklist Uniformité

### Structure Visuelle

- [x] Tous utilisent `min-h-[40vh]` pour le centrage vertical
- [x] Tous utilisent `max-w-md` pour la largeur
- [x] Tous utilisent `py-12 px-6` pour le padding
- [x] Tous ont une icône `h-6 w-6` avec icône interne `h-4 w-4`
- [x] Tous ont un titre `text-lg font-semibold`
- [x] Tous ont une description `text-sm text-muted-foreground`

### Contenu

- [x] Tous expliquent pourquoi la page est vide
- [x] Tous indiquent quelle action faire ensuite
- [x] Pas de texte placeholder générique ou technique
- [x] Descriptions courtes et claires (1 phrase max)
- [x] Actions claires et directes

### Style

- [x] Pas de visuels marketing
- [x] Pas de blocs surdimensionnés
- [x] Style sobre et professionnel
- [x] Cohérence avec le Design System V1

---

## 📊 Résumé des Modifications

| Page | Composant | Titre | Description | Action |
|------|-----------|-------|-------------|--------|
| `/projects` | `EmptyProjectsState` | "Aucun projet" | "Créez votre premier projet pour organiser vos documents et générer vos mémoires." | "Créer un projet" |
| `/projects/[id]/documents` | `EmptyDocumentsState` | "Aucun document" | "Importez des documents techniques (PDF, DOCX, images) pour les analyser et extraire des données." | Aucune (upload visible) |
| `/documents` | Inline | "Aucun document" / "Aucun document trouvé" | "Créez un projet..." / "Ajustez vos filtres..." | "Créer un projet" (si aucun) |
| `/projects/[id]/dpgf` | `EmptyDPGFState` | "Aucun DPGF extrait" | "Importez des documents puis extrayez un DPGF pour structurer vos données de prix." | "Extraire un DPGF" |
| `/projects/[id]/cctp` | `EmptyCCTPState` | "Aucun CCTP généré" | "Générez un CCTP depuis un DPGF validé ou des documents pour créer votre cahier des clauses techniques." | "Générer un CCTP" |

---

## ✅ Confirmation

**Tous les états vides sont maintenant cohérents entre eux et respectent le Design System Redyce V1.**

### Points Vérifiés

- ✅ Structure uniforme : même pattern JSX partout
- ✅ Dimensions uniformes : `h-6 w-6` pour l'icône container, `h-4 w-4` pour l'icône
- ✅ Typographie uniforme : `text-lg` titre, `text-sm` description
- ✅ Espacements uniformes : `min-h-[40vh]`, `max-w-md`, `py-12 px-6`
- ✅ Textes clairs : expliquent pourquoi vide et quelle action faire
- ✅ Pas de marketing : style sobre et professionnel
- ✅ Boutons compacts : `size="sm"` avec icônes

**L'application paraît maintenant claire, professionnelle et rassurante même sans données.**

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Statut** : ✅ Tous les empty states uniformisés et polis

