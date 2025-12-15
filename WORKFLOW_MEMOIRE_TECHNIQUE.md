# 📋 Workflow Complet - Mémoire Technique

## 🎯 Étapes pour créer et remplir un mémoire technique

### **Étape 1 : Uploader le Template Mémoire**
📍 **Page** : `/projects/[id]/documents`

1. Dans le bloc gauche "Template mémoire (obligatoire)"
2. Glissez-déposez ou sélectionnez un fichier DOCX ou PDF contenant les questions du client
3. Le fichier est automatiquement uploadé
4. ✅ Le warning jaune disparaît et est remplacé par un **bandeau vert** indiquant "Template mémoire défini"

---

### **Étape 2 : Extraire les Questions (Parser le Template)**
📍 **Page** : `/projects/[id]/documents` (toujours)

1. Une fois le template uploadé, un bouton **"Extraire les questions"** apparaît
2. Cliquez sur ce bouton
3. L'IA parse le template et extrait automatiquement :
   - Les sections (ITEMs)
   - Les questions individuelles
   - Le formulaire entreprise (si présent)
4. ✅ Un toast confirme le succès : "Template parsé, X sections extraites"

---

### **Étape 3 : Vérifier/Éditer les Questions (Optionnel)**
📍 **Page** : `/projects/[id]/questions`

1. Après le parsing, un lien **"Voir les questions"** apparaît dans le bandeau vert
2. OU allez dans l'onglet **"Mémoire technique"** puis cliquez sur "Voir les questions"
3. Cette page permet de :
   - Voir toutes les sections et questions extraites
   - Éditer le titre d'une question
   - Marquer une question comme obligatoire/optionnelle
   - Supprimer une question
   - Accéder au formulaire entreprise

---

### **Étape 4 : Créer un Nouveau Mémoire**
📍 **Page** : `/projects/[id]/memoire`

1. Allez dans l'onglet **"Mémoire technique"** du projet
2. Cliquez sur le bouton **"Nouveau mémoire"**
3. Remplissez :
   - Le titre du mémoire
   - Sélectionnez le template mémoire (celui que vous venez d'uploader)
4. Cliquez sur **"Créer le mémoire"**
5. ✅ Vous êtes redirigé vers l'éditeur de mémoire

---

### **Étape 5 : Remplir le Mémoire**
📍 **Page** : `/projects/[id]/memoire/[memoireId]`

L'éditeur est divisé en **3 colonnes** :

#### **Colonne Gauche : Liste des Sections**
- Liste de toutes les sections/questions extraites du template
- Indicateur de statut (À rédiger / Complété)
- Cliquez sur une section pour l'éditer

#### **Colonne Centrale : Éditeur**
- Affiche la section sélectionnée
- Titre et question (non éditables)
- Zone de texte pour votre réponse
- **Autosave** automatique toutes les 800ms
- Bouton "Marquer comme relu"

#### **Colonne Droite : Panneau IA**
- **4 actions disponibles** :
  - **Compléter** : L'IA complète votre texte
  - **Reformuler** : L'IA reformule votre texte
  - **Raccourcir** : L'IA raccourcit votre texte
  - **Extraire exigences** : L'IA extrait les exigences du texte

---

### **Étape 6 : Exporter le Mémoire**
📍 **Page** : `/projects/[id]/exports`

1. Allez dans l'onglet **"Exports"** du projet
2. Cliquez sur **"Générer DOCX"**
3. Le fichier est généré en respectant le format du template client
4. Téléchargez le fichier final

---

## 🔗 Navigation Rapide

| Action | Page |
|--------|------|
| Uploader template | `/projects/[id]/documents` |
| Extraire questions | `/projects/[id]/documents` (bouton "Extraire les questions") |
| Voir/Éditer questions | `/projects/[id]/questions` |
| Créer mémoire | `/projects/[id]/memoire` → "Nouveau mémoire" |
| Remplir mémoire | `/projects/[id]/memoire/[memoireId]` |
| Exporter | `/projects/[id]/exports` |

---

## ⚠️ Points Importants

1. **Le template est obligatoire** avant de créer un mémoire
2. **Le parsing est nécessaire** pour extraire les questions
3. **Le formulaire entreprise** peut être rempli sur `/projects/[id]/company-form` (optionnel mais recommandé pour améliorer les réponses IA)
4. **L'autosave** fonctionne automatiquement, pas besoin de sauvegarder manuellement
5. **L'IA** utilise le contexte du projet (documents, exigences, profil entreprise) pour générer des réponses pertinentes

