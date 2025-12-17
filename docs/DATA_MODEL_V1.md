# Modèle de Données V1 - Mémoires Techniques

## 📋 Vue d'Ensemble

Ce document formalise et verrouille le modèle de données V1 de l'application Redyce pour la génération de mémoires techniques.

**Date de verrouillage :** Décembre 2024  
**Version :** 1.0  
**Statut :** FIGÉ (aucune modification structurelle sans refactoring explicite)

---

## 🎯 Objectif

L'application permet de générer des mémoires techniques à partir de :
- Un template de questions (extrait d'un document MODELE_MEMOIRE)
- Des réponses par mémoire (réponses aux questions du template)
- De données d'entreprise réutilisables (globales au projet)
- De versions successives d'un même mémoire (versioning avec snapshots)

---

## 📊 Entités Principales

### 1. Projet (`Project`)

**Périmètre :**
- Conteneur principal regroupant tous les éléments d'un appel d'offres
- Propriété d'un utilisateur unique (`userId`)

**Relations :**
- 1 projet → N documents (`Document`)
- 1 projet → N mémoires (`Memoire`)
- 1 projet → 1 `TemplateCompanyForm` (via Document template)

**Règles :**
- Propriété exclusive d'un utilisateur
- Isolation stricte entre utilisateurs

---

### 2. Template de Questions (Structure Immuable)

#### Document Template (`Document` avec `documentType = MODELE_MEMOIRE`)

**Périmètre :**
- Document source (PDF/DOCX) contenant le modèle de mémoire
- Structure de questions extraites via parsing IA
- **UNE FOIS EXTRAIT, LA STRUCTURE EST IMMUABLE**

#### Sections de Template (`TemplateSection`)

**Périmètre :**
- Sections/Items extraites du template (ex: "ITEM 1: Moyens humains")
- Structure immuable après extraction

**Champs immuables :**
- `order` : Ordre d'affichage
- `title` : Titre de la section
- `required` : Statut obligatoire

**Règles strictes :**
- ❌ INTERDIT : Modification silencieuse de `order`, `title`, `required`
- ✅ AUTORISÉ : Suppression explicite par l'utilisateur
- ✅ AUTORISÉ : Ajout de nouvelles sections (action explicite utilisateur)

#### Questions de Template (`TemplateQuestion`)

**Périmètre :**
- Questions extraites du template
- Une fois extraite, la question est **IMMUABLE**

**Champs immuables :**
- `title` : Texte de la question
- `order` : Ordre dans la section
- `questionType` : Type (TEXT, YES_NO)
- `required` : Statut obligatoire
- `isGroupHeader` : Si c'est un titre de groupe (pas de réponse)

**Règles strictes :**
- ❌ INTERDIT : Modification silencieuse de `title`, `order`, `questionType`, `required`, `isGroupHeader`
- ✅ AUTORISÉ : Suppression explicite par l'utilisateur
- ✅ AUTORISÉ : Ajout de nouvelles questions (action explicite utilisateur)

**Relations :**
- 1 `TemplateSection` → N `TemplateQuestion`
- 1 `TemplateQuestion` → 0..1 `TemplateQuestion` parent (sous-questions)

---

### 3. Mémoire Technique (`Memoire`)

**Périmètre :**
- Un mémoire = une **VERSION** spécifique (snapshot à l'instant T)
- Chaque version est indépendante et figée une fois créée

**Champs clés :**
- `versionNumber` : Numéro séquentiel (1, 2, 3...) - **IMMUABLE**
- `templateDocumentId` : Référence au template source - **IMMUABLE après création**
- `parentMemoireId` : Lien vers la version parente (pour versioning)
- `isFrozen` : Si `true`, la version est figée (read-only)

**Règles strictes :**
- ✅ Nouvelle version = clone complet de toutes les réponses
- ✅ Version figée (`isFrozen=true`) = **read-only** (aucune modification possible)
- ✅ Version parente est automatiquement figée lors de la création d'une nouvelle version
- ❌ INTERDIT : Modification d'une version figée

**Relations :**
- 1 `Memoire` → N `MemoireSection` (réponses de cette version)
- 1 `Memoire` → 0..1 `Memoire` parent (version précédente)
- 1 `Memoire` → N `Memoire` enfants (versions suivantes)

---

### 4. Réponse (`MemoireSection`)

**Périmètre :**
- Une réponse = contenu pour une question spécifique dans une version spécifique
- **TOUJOURS liée à une version** (`memoireId` obligatoire)

**Champs clés :**
- `memoireId` : Version parente - **OBLIGATOIRE**
- `question` : Texte de la question (référence au `TemplateQuestion` pour traçabilité)
- `order` : Ordre dans cette version (peut différer du template si réorganisation)
- `content` : Contenu de la réponse (mutable uniquement si version non figée)
- `status` : Statut (DRAFT, IN_PROGRESS, REVIEWED, VALIDATED)

**Identifiant composite :**
- `(memoireId + order)` pour l'unicité dans une version

**Règles strictes :**
- ❌ INTERDIT : Réponse sans version (`memoireId` obligatoire)
- ❌ INTERDIT : Modification du contenu si version figée (`isFrozen=true`)
- ✅ Mutable uniquement si la version parente n'est pas figée

**Relations :**
- 1 `MemoireSection` → 1 `Memoire` (version parente, OBLIGATOIRE)
- Référence implicite à `TemplateQuestion` via `question`/`title` (traçabilité)

---

### 5. Données d'Entreprise (`TemplateCompanyForm`)

**Périmètre :**
- Informations réutilisables entre tous les mémoires d'un projet
- Liées au Document template (pas au mémoire spécifique)
- Globales au projet

**Champs :**
- `fields` : Champs structurés (nom entreprise, rédacteur, date, etc.)
- `companyPresentation` : Texte libre de présentation entreprise (stocké dans `fields`)

**Règles :**
- ✅ Global au projet (via `templateDocumentId`)
- ✅ Réutilisable entre tous les mémoires du même projet
- ✅ Lors de l'export, un snapshot est créé dans `Memoire.metadata` pour traçabilité

**Relations :**
- 1 `TemplateCompanyForm` → 1 `Document` (template, UNIQUE)

---

## 🔒 Règles Métier Strictes

### Règle 1 : Immutabilité des Questions

**Une fois extraites du template, les questions sont IMMUABLES.**

- `TemplateSection` : `order`, `title`, `required` ne peuvent pas être modifiés silencieusement
- `TemplateQuestion` : `title`, `order`, `questionType`, `required`, `isGroupHeader` ne peuvent pas être modifiés silencieusement
- Seule la suppression explicite par l'utilisateur est autorisée
- L'ajout de nouvelles questions doit être une action explicite

**Validation :**
```typescript
// Voir src/types/memoire-v1.ts : validateQuestionImmutability()
```

---

### Règle 2 : Lien Question + Version pour les Réponses

**Une réponse est TOUJOURS liée à une question spécifique ET une version spécifique.**

- Identifiant composite : `(memoireId + order)`
- Référence à la question via `question`/`title` (pour traçabilité)
- `memoireId` est **OBLIGATOIRE** (pas de réponse orpheline)

**Validation :**
```typescript
// Voir src/types/memoire-v1.ts : validateSectionHasVersion()
```

---

### Règle 3 : Versions = Snapshots Figés

**Une version de mémoire est un snapshot à l'instant T.**

- Lors de la création d'une nouvelle version :
  - Toutes les réponses sont clonées
  - La version parente est automatiquement figée (`isFrozen=true`)
  - Nouvelle version commence avec `isFrozen=false`
  
- Version figée (`isFrozen=true`) :
  - Read-only (aucune modification possible)
  - Toutes les réponses sont en lecture seule
  - Aucun bouton de modification affiché dans l'UI

**Validation :**
```typescript
// Voir src/types/memoire-v1.ts : validateVersionNotFrozen()
```

---

### Règle 4 : Données d'Entreprise = Globales au Projet

**Les données d'entreprise sont réutilisables entre tous les mémoires d'un projet.**

- Liées au Document template (pas au mémoire)
- Réutilisables entre tous les mémoires utilisant le même template
- Lors de l'export, un snapshot est créé dans `Memoire.metadata` pour garantir la traçabilité

---

### Règle 5 : Interdictions Strictes

#### ❌ INTERDIT : Réponses sans version

Toute `MemoireSection` doit avoir un `memoireId` valide. Aucune réponse orpheline n'est autorisée.

#### ❌ INTERDIT : Modification silencieuse de la structure des questions

Les champs immuables de `TemplateSection` et `TemplateQuestion` ne peuvent pas être modifiés sans action utilisateur explicite.

#### ❌ INTERDIT : Écrasement automatique de contenu

Aucun contenu ne peut être écrasé sans action utilisateur explicite (pas d'autosave silencieux, pas de merge automatique).

#### ❌ INTERDIT : Modification d'une version figée

Une version avec `isFrozen=true` ne peut être que consultée (read-only).

---

## 📝 Documentations dans le Code

### Fichiers de Référence

1. **`src/types/memoire-v1.ts`**
   - Types TypeScript formels pour toutes les entités V1
   - Interfaces avec commentaires détaillés
   - Fonctions de validation

2. **`prisma/schema.prisma`**
   - Schéma de base de données avec commentaires détaillés
   - Règles métier documentées dans les commentaires des modèles
   - Contraintes d'intégrité (unique, index, relations)

3. **`docs/DATA_MODEL_V1.md`** (ce fichier)
   - Documentation complète du modèle de données V1
   - Règles métier explicitées
   - Exemples et cas d'usage

---

## 🔄 Flux de Données

### Création d'un Mémoire

1. L'utilisateur sélectionne un template (Document MODELE_MEMOIRE)
2. Le système crée un nouveau `Memoire` avec `versionNumber=1`, `isFrozen=false`
3. Les `MemoireSection` sont créées à partir des `TemplateQuestion` :
   - Chaque question du template → une `MemoireSection`
   - `question` copié depuis `TemplateQuestion.title`
   - `content` initialisé à vide ou null
   - `memoireId` = ID du nouveau mémoire (OBLIGATOIRE)

### Création d'une Nouvelle Version

1. L'utilisateur clique sur "Nouvelle version"
2. Validation : version actuelle non figée (`isFrozen=false`)
3. La version actuelle est figée (`isFrozen=true`)
4. Un nouveau `Memoire` est créé :
   - `versionNumber` = version précédente + 1
   - `parentMemoireId` = ID de la version précédente
   - `isFrozen=false`
5. Toutes les `MemoireSection` de la version précédente sont clonées :
   - Même `question`, `title`, `order`
   - Même `content` (réponses copiées)
   - Nouveau `memoireId` = ID de la nouvelle version

### Modification d'une Réponse

1. L'utilisateur modifie le contenu d'une `MemoireSection`
2. Validation : `Memoire.isFrozen=false` (version non figée)
3. `MemoireSection.content` est mis à jour
4. `MemoireSection.status` peut passer de REVIEWED/VALIDATED à DRAFT si contenu modifié

---

## 🚀 Évolutions Futures (Hors V1)

Le modèle V1 est figé pour garantir la stabilité. Les évolutions futures nécessiteront un refactoring explicite :

- Collaboration multi-utilisateurs
- Historique des modifications (audit trail)
- Modèles de données alternatifs
- Templates multiples par projet
- Import/export avancé

---

## ✅ Checklist de Conformité V1

Lors de toute modification du code, vérifier :

- [ ] Aucune modification silencieuse de `TemplateQuestion` ou `TemplateSection`
- [ ] Toutes les `MemoireSection` ont un `memoireId` valide
- [ ] Aucune modification possible si `Memoire.isFrozen=true`
- [ ] Les données d'entreprise sont bien globales au projet (via template)
- [ ] Aucun écrasement automatique de contenu sans action utilisateur

---

**Version :** 1.0  
**Dernière mise à jour :** Décembre 2024  
**Statut :** FIGÉ

