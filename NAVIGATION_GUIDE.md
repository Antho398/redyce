# Guide de Navigation - Redyce

## 🗺️ Comment utiliser Redyce

### Flux complet : De la création à la génération

```
1. Connexion → 2. Créer un projet → 3. Uploader des documents 
→ 4. Extraire DPGF → 5. Générer CCTP → 6. Finaliser
```

---

## 📍 Page par page

### 1️⃣ Page d'accueil : `/`
- Affiche "Redyce" avec boutons "Se connecter" et "S'inscrire"
- Action : Cliquer sur "Se connecter"

### 2️⃣ Page de connexion : `/login`
- Formulaire email + mot de passe
- Action : Se connecter avec ses identifiants
- → Redirection vers `/projects`

### 3️⃣ Page des projets : `/projects`
- **Affiche maintenant vos VRAIS projets** (plus de données mockées)
- Liste des projets avec :
  - Nom du projet
  - Description
  - Nombre de documents
  - Nombre de mémoires
  - Date de création

**Actions possibles :**
- Cliquer sur "Nouveau Projet" → Créer un projet
- Cliquer sur "Voir" → Aller sur la page du projet
- Cliquer sur "Documents" → Aller directement aux documents du projet

### 4️⃣ Page de création de projet : `/projects/new`
- Formulaire avec :
  - Nom du projet (obligatoire)
  - Description (optionnel)
- Action : Remplir et cliquer sur "Créer le projet"
- → Redirection automatique vers `/projects/[id]`

### 5️⃣ Page d'un projet : `/projects/[id]`
- Affiche les détails du projet
- **3 cartes cliquables :**
  - **Documents** → `/projects/[id]/documents`
  - **DPGF** → `/projects/[id]/dpgf`
  - **CCTP** → `/projects/[id]/cctp`

### 6️⃣ Page Documents : `/projects/[id]/documents`
- **Zone d'upload en haut** :
  - Drag & drop ou sélection de fichiers
  - Types supportés : PDF, DOCX, JPEG, PNG, GIF
  - Sélection du type de document (CCTP, DPGF, RC, CCAP)
  
- **Liste des documents en dessous** :
  - Affiche tous les documents uploadés
  - Statut de chaque document (Uploadé, Traitement..., Traité, Erreur)
  - Clic sur un document pour voir les détails

**Actions possibles :**
- Uploader un fichier
- Voir un document (clic)
- Le document apparaît automatiquement après upload

### 7️⃣ Page DPGF : `/projects/[id]/dpgf`
- Liste des DPGF extraits
- Bouton "Extraire depuis document"
- Visualisation du DPGF structuré

**Actions possibles :**
- Extraire un DPGF depuis un document
- Voir les détails d'un DPGF
- Valider un DPGF

### 8️⃣ Page CCTP : `/projects/[id]/cctp`
- Liste des CCTP générés
- Bouton "Générer un CCTP"
- Visualisation du CCTP

**Actions possibles :**
- Générer un CCTP depuis un DPGF
- Finaliser un CCTP
- Créer une nouvelle version

---

## 🎯 Scénario d'utilisation typique

### Pour uploader un document et générer un CCTP :

1. **Aller sur `/projects`**
   - Vous voyez vos projets (ou "Vous n'avez pas encore de projet")
   - Si aucun projet, cliquer sur "Nouveau Projet"

2. **Créer un projet** (si nécessaire)
   - Aller sur `/projects/new`
   - Remplir nom + description
   - Cliquer sur "Créer le projet"
   - → Redirection vers `/projects/[id]`

3. **Accéder aux documents**
   - Sur la page projet, cliquer sur la carte "Documents"
   - OU cliquer directement sur "Documents" dans la carte projet de `/projects`
   - → Redirection vers `/projects/[id]/documents`

4. **Uploader un document**
   - Dans la zone d'upload :
     - Sélectionner le type (ex: "DPGF")
     - Glisser-déposer un fichier ou cliquer "Sélectionner des fichiers"
     - Cliquer sur "Uploader" ou "Téléverser tout"
   - ✅ Toast de succès : "Document uploadé avec succès"
   - Le document apparaît dans la liste

5. **Parser le document** (si nécessaire)
   - Le document est uploadé avec statut "Uploadé"
   - Pour l'extraire, il faut le parser
   - (Le parsing peut être fait automatiquement ou manuellement selon votre implémentation)

6. **Extraire un DPGF**
   - Aller sur `/projects/[id]/dpgf`
   - Cliquer sur "Extraire depuis document"
   - Sélectionner le document parsé
   - → DPGF extrait et visible

7. **Générer un CCTP**
   - Aller sur `/projects/[id]/cctp`
   - Cliquer sur "Générer un CCTP"
   - Sélectionner un DPGF (si disponible)
   - Ajouter des exigences (optionnel)
   - Cliquer sur "Générer le CCTP"
   - ✅ Toast de succès : "CCTP généré avec succès"

8. **Finaliser le CCTP**
   - Cliquer sur le CCTP généré
   - Vérifier le contenu
   - Cliquer sur "Finaliser"
   - ✅ Toast : "CCTP finalisé"

---

## 🔑 Points importants

### Navigation principale
- **Menu en haut** : "Projets" et "Documents"
  - "Projets" → `/projects` (liste des projets)
  - "Documents" → `/documents` (liste globale des documents - à implémenter)

### Actions depuis les cartes projet
- "Voir" → Page du projet (`/projects/[id]`)
- "Documents" → Page documents du projet (`/projects/[id]/documents`)

### Actions depuis la page projet
- Carte "Documents" → `/projects/[id]/documents`
- Carte "DPGF" → `/projects/[id]/dpgf`
- Carte "CCTP" → `/projects/[id]/cctp`

---

## ❓ FAQ

**Q : Où puis-je uploader un document ?**
R : Sur la page `/projects/[id]/documents` d'un projet. Cliquez sur "Documents" depuis la page projet.

**Q : Comment créer un projet ?**
R : Sur `/projects`, cliquez sur "Nouveau Projet", remplissez le formulaire.

**Q : Où puis-je voir mes documents ?**
R : Sur `/projects/[id]/documents` pour les documents d'un projet spécifique.

**Q : Comment extraire un DPGF ?**
R : Sur `/projects/[id]/dpgf`, cliquez sur "Extraire depuis document" et sélectionnez un document parsé.

**Q : Comment générer un CCTP ?**
R : Sur `/projects/[id]/cctp`, cliquez sur "Générer un CCTP" et suivez les étapes.

---

**Mise à jour :** 2024-12-12
**Statut :** Navigation complète et fonctionnelle

