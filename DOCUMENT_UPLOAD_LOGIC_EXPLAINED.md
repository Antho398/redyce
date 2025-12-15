# 📋 Logique d'Affichage des Documents - Explication

## Structure de la Page `/projects/[id]/documents`

La page est organisée en **3 sections principales** :

### 1. **Section Template Mémoire (Colonne Gauche)**
- **Bloc dédié** : `TemplateMemoireCard`
- **Comportement** :
  - Si **aucun template** : Affiche warning + zone d'upload
  - Si **template existe** : Affiche uniquement la carte verte avec les infos (zone d'upload **cachée**)

### 2. **Section Documents de Contexte - Zone d'Upload (Colonne Droite)**
- **Bloc dédié** : `ProjectDocumentsCard` avec `showTable={false}`
- **Comportement** :
  - Affiche **uniquement** la zone d'upload
  - Affiche la liste des **fichiers sélectionnés** (pendingFiles) avec leur type
  - **N'affiche PAS** la table des documents déjà uploadés

### 3. **Section Documents de Contexte - Tableau (Pleine Largeur, En Dessous)**
- **Bloc séparé** : Card avec `DocumentsTable`
- **Condition d'affichage** : `contextDocuments.length > 0`
- **Comportement** :
  - Affiche **uniquement** les documents **déjà uploadés** en base de données
  - Filtre les documents pour exclure `MODELE_MEMOIRE`
  - Tableau avec colonnes : Nom, Type, Taille, Date, Statut, Actions

---

## 🔄 Workflow d'Upload

### Étape 1 : Sélection de Fichiers
1. L'utilisateur sélectionne plusieurs fichiers (drag & drop ou parcourir)
2. Les fichiers apparaissent dans la **liste "X fichiers sélectionnés"** dans le bloc de droite
3. Chaque fichier doit avoir un `documentType` assigné

### Étape 2 : Upload
1. Quand un `documentType` est sélectionné, tous les fichiers sans type reçoivent ce type
2. Chaque fichier est uploadé individuellement via `POST /api/documents/upload`
3. Pendant l'upload, le fichier montre un statut "En cours" dans la liste

### Étape 3 : Après Upload Réussi
1. Le fichier disparaît de la liste "fichiers sélectionnés" après 3 secondes
2. Le document est créé en base de données avec le `documentType` assigné
3. `fetchDocuments()` est appelé pour recharger la liste
4. Le document apparaît maintenant dans le **tableau en dessous** (section 3)

---

## ❓ Pourquoi 2 Blocs Séparés ?

**Raison** : Séparation des préoccupations
- **Bloc de droite** : Zone de travail (upload en cours, fichiers pending)
- **Bloc en dessous** : Archivage (documents déjà uploadés, persistés en DB)

Cela permet :
- ✅ De garder une interface claire pendant l'upload
- ✅ D'avoir un historique stable des documents uploadés
- ✅ De distinguer les fichiers "en cours" des documents "finalisés"

---

## 🐛 Problème Identifié : Documents qui ne Correspondent Pas

### Cause Probable
Quand plusieurs fichiers sont uploadés en **groupe avec le même type sélectionné**, ils reçoivent tous le même `documentType`. Cependant, il peut y avoir un décalage si :
1. Les fichiers sont uploadés avec un type par défaut (ex: "AE")
2. L'utilisateur change le type sélecteur après que certains fichiers soient déjà uploadés
3. Les fichiers déjà en base gardent leur ancien type

### Solution Implémentée
- ✅ Possibilité d'**éditer le type de document** après upload via le menu actions dans `DocumentsTable`
- ✅ Route API `PUT /api/documents/[id]` pour mettre à jour le `documentType`
- ✅ Service `updateDocument` pour gérer la mise à jour

---

## 🔧 Améliorations Futures Possibles

1. **Assigner un type différent par fichier** avant l'upload
2. **Bulk edit** : Modifier le type de plusieurs documents à la fois
3. **Détection automatique** du type basée sur le nom du fichier (ex: "DPGF_TLB.pdf" → DPGF)

