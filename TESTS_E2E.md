# Tests End-to-End - Redyce

Ce document décrit le scénario de test complet pour vérifier le flux Redyce de bout en bout.

---

## 🚀 Prérequis

### 1. Configuration de l'environnement

Assurez-vous d'avoir :
- Node.js 18+ installé
- PostgreSQL 15+ installé et démarré
- Une clé API OpenAI valide

### 2. Lancer le projet en local

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
# Créer/modifier .env.local avec :
# DATABASE_URL="postgresql://user:password@localhost:5432/redyce?schema=public"
# OPENAI_API_KEY="sk-..."
# NEXTAUTH_SECRET="votre-secret"
# NEXTAUTH_URL="http://localhost:3000"

# 3. Initialiser la base de données
npm run db:generate
npm run db:push

# 4. Lancer le serveur de développement
npm run dev
```

Le serveur sera accessible sur **http://localhost:3000**

---

## 📋 Scénario de test complet

### Étape 1 : Créer un compte utilisateur

**URL à visiter :** `http://localhost:3000/register`

**Ce que vous devez voir :**
- Un formulaire avec les champs :
  - Nom (optionnel)
  - Email
  - Mot de passe (avec icône pour afficher/masquer)
- Un bouton "Créer mon compte"
- Un lien "Déjà un compte ? Se connecter"

**Actions à effectuer :**
1. Remplir le formulaire :
   - Nom : "Test User"
   - Email : "test@redyce.fr"
   - Mot de passe : "testpassword123"
2. Cliquer sur "Créer mon compte"

**Ce qui doit se passer :**
- ✅ Redirection automatique vers `/login?registered=true`
- ✅ **Base de données** : Un nouvel enregistrement dans la table `users` :
  ```sql
  SELECT * FROM users WHERE email = 'test@redyce.fr';
  -- Devrait retourner un user avec :
  -- - id (cuid généré)
  -- - email: 'test@redyce.fr'
  -- - password: (hash bcrypt)
  -- - name: 'Test User'
  -- - createdAt, updatedAt
  ```

---

### Étape 2 : Se connecter

**URL à visiter :** `http://localhost:3000/login`

**Ce que vous devez voir :**
- Un formulaire de connexion avec :
  - Champ Email
  - Champ Mot de passe (avec icône pour afficher/masquer)
- Un bouton "Se connecter"
- Un lien "Pas encore de compte ? Créer un compte"

**Actions à effectuer :**
1. Entrer l'email : "test@redyce.fr"
2. Entrer le mot de passe : "testpassword123"
3. Cliquer sur "Se connecter"

**Ce qui doit se passer :**
- ✅ Redirection automatique vers `/projects`
- ✅ **Base de données** : Une session NextAuth est créée (JWT stocké dans les cookies)
- ✅ La barre de navigation affiche l'email de l'utilisateur connecté

---

### Étape 3 : Créer un projet

**URL à visiter :** `http://localhost:3000/projects`

**Ce que vous devez voir :**
- Une page "Mes Projets" avec :
  - Titre "Mes Projets"
  - Liste des projets (vide si premier projet)
  - Bouton "Nouveau Projet"

**Actions à effectuer :**
1. Cliquer sur "Nouveau Projet"
2. Vous serez redirigé vers `/projects/new`
3. **Note :** La page de création n'est pas encore complètement implémentée. Pour créer un projet, utilisez l'API directement ou complétez la page.

**Alternative - Créer via l'API :**

Ouvrir la console du navigateur (F12) et exécuter :

```javascript
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Projet Test Rénovation',
    description: 'Projet de test pour la rénovation d\'une école primaire'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Projet créé:', data);
  // Noter le projectId retourné
  window.location.href = `/projects/${data.data.id}`;
});
```

**Ce qui doit se passer :**
- ✅ Redirection vers `/projects/[id]` avec l'ID du projet créé
- ✅ **Base de données** : Un nouvel enregistrement dans la table `projects` :
  ```sql
  SELECT * FROM projects WHERE "userId" = (SELECT id FROM users WHERE email = 'test@redyce.fr');
  -- Devrait retourner le projet avec :
  -- - id (cuid généré)
  -- - name: 'Projet Test Rénovation'
  -- - description: 'Projet de test...'
  -- - userId: (id de l'utilisateur connecté)
  -- - createdAt, updatedAt
  ```

---

### Étape 4 : Uploader un document (PDF ou DOCX)

**URL à visiter :** `/projects/[id]/documents` (remplacer `[id]` par l'ID du projet créé)

**Ce que vous devez voir :**
- Page "Documents du Projet" avec :
  - Section "Upload de Documents" à gauche
  - Liste des documents (vide au début) à droite
  - Bouton "Télécharger un fichier" ou zone de drag & drop
  - Menu déroulant pour sélectionner le type de document (CCTP, DPGF, RC, CCAP, etc.)

**Actions à effectuer :**
1. Préparer un fichier PDF ou DOCX de test (exemple : un DPGF en PDF)
2. Dans le menu déroulant, sélectionner "DPGF" (ou le type correspondant à votre fichier)
3. Cliquer sur "Télécharger un fichier" ou glisser-déposer le fichier
4. Cliquer sur "Uploader"

**Ce qui doit se passer :**
- ✅ Le fichier apparaît dans la liste avec le statut "Uploadé" (icône horloge)
- ✅ Le fichier est sauvegardé dans `./uploads/` (ou le chemin configuré)
- ✅ **Base de données** : Un nouvel enregistrement dans la table `documents` :
  ```sql
  SELECT * FROM documents WHERE "projectId" = '[id-du-projet]';
  -- Devrait retourner le document avec :
  -- - id (cuid généré)
  -- - name: (nom du fichier)
  -- - fileName: (nom unique généré)
  -- - filePath: (chemin vers le fichier)
  -- - fileSize: (taille en octets)
  -- - mimeType: 'application/pdf' ou 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  -- - documentType: 'DPGF' (ou autre selon sélection)
  -- - projectId: (id du projet)
  -- - status: 'uploaded'
  -- - createdAt, updatedAt
  ```

---

### Étape 5 : Lancer l'extraction DPGF

**Option A : Depuis la page Documents**

1. Sur la page `/projects/[id]/documents`, cliquer sur le document uploadé
2. Si la page de détail du document a un bouton "Analyser" ou "Parser", cliquer dessus

**Option B : Depuis la page DPGF**

1. Aller sur `/projects/[id]/dpgf`
2. Cliquer sur "Extraire depuis document"
3. Sélectionner le document à analyser
4. Cliquer sur "Extraire DPGF"

**Alternative - Via l'API :**

```javascript
// 1. D'abord parser le document pour extraire le texte
const documentId = '[id-du-document]';
fetch(`/api/documents/${documentId}/parse`, {
  method: 'POST'
})
.then(r => r.json())
.then(data => {
  console.log('Document parsé:', data);
  
  // 2. Ensuite extraire le DPGF
  return fetch('/api/dpgf/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: documentId
    })
  });
})
.then(r => r.json())
.then(data => {
  console.log('DPGF extrait:', data);
  // Noter le dpgfId
});
```

**Ce qui doit se passer :**

**Phase 1 - Parsing du document :**
- ✅ Le statut du document passe à "processing"
- ✅ Le document est parsé (PDF → texte ou DOCX → texte)
- ✅ **Base de données** : Un enregistrement dans `document_analyses` :
  ```sql
  SELECT * FROM document_analyses WHERE "documentId" = '[id-du-document]';
  -- Devrait contenir :
  -- - id (cuid généré)
  -- - documentId: (id du document)
  -- - analysisType: 'extraction'
  -- - status: 'completed'
  -- - result: (JSON avec le texte extrait)
  ```
- ✅ Le statut du document passe à "processed"

**Phase 2 - Extraction DPGF :**
- ✅ **Base de données** : Un enregistrement dans `dpgf_structured` :
  ```sql
  SELECT * FROM dpgf_structured WHERE "projectId" = '[id-du-projet]';
  -- Devrait contenir :
  -- - id (cuid généré)
  -- - projectId: (id du projet)
  -- - documentId: (id du document source)
  -- - title: (titre extrait)
  -- - reference: (référence extraite)
  -- - data: (JSON structuré avec articles, matériaux, normes, etc.)
  -- - status: 'extracted'
  -- - confidence: (score de confiance 0-1)
  ```
- ✅ Sur la page `/projects/[id]/dpgf`, le DPGF extrait apparaît dans la liste
- ✅ Vous pouvez cliquer sur le DPGF pour voir les détails structurés

---

### Étape 6 : Lancer la génération CCTP

**URL à visiter :** `/projects/[id]/cctp`

**Ce que vous devez voir :**
- Page "CCTP Générés" avec :
  - Liste des CCTP existants (vide au début)
  - Bouton "Générer un CCTP"
  - Section pour sélectionner un DPGF source (si disponible)

**Actions à effectuer :**
1. Si vous avez un DPGF extrait, il sera automatiquement sélectionné
2. (Optionnel) Ajouter des "Exigences utilisateur" dans le champ texte
3. Cliquer sur "Générer le CCTP"

**Ce qui doit se passer :**
- ✅ Un message de chargement apparaît
- ✅ L'IA génère le CCTP depuis le DPGF structuré
- ✅ **Base de données** : Un enregistrement dans `cctp_generated` :
  ```sql
  SELECT * FROM cctp_generated WHERE "projectId" = '[id-du-projet]';
  -- Devrait contenir :
  -- - id (cuid généré)
  -- - projectId: (id du projet)
  -- - dpgfId: (id du DPGF source)
  -- - title: 'CCTP - [nom-du-projet]'
  -- - content: (texte complet du CCTP formaté)
  -- - structure: (JSON structuré du CCTP)
  -- - status: 'generated'
  -- - version: 1
  ```
- ✅ Le CCTP apparaît dans la liste
- ✅ Vous pouvez cliquer sur le CCTP pour voir le contenu complet formaté

---

### Étape 7 : Finaliser le CCTP

**URL à visiter :** `/projects/[id]/cctp` (et cliquer sur le CCTP généré)

**Ce que vous devez voir :**
- Visualiseur de CCTP avec :
  - Contenu complet du CCTP formaté
  - Sections structurées (Projet, Articles, Matériaux, Prescriptions, etc.)
  - Bouton "Finaliser" (si disponible)

**Actions à effectuer :**
1. Vérifier le contenu du CCTP
2. Si satisfait, cliquer sur "Finaliser" (ou utiliser l'API)

**Alternative - Via l'API :**

```javascript
const cctpId = '[id-du-cctp]';
fetch(`/api/cctp/${cctpId}/finalize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('CCTP finalisé:', data);
});
```

**Ce qui doit se passer :**
- ✅ Le statut du CCTP passe à "finalized"
- ✅ **Base de données** : Mise à jour dans `cctp_generated` :
  ```sql
  SELECT * FROM cctp_generated WHERE id = '[id-du-cctp]';
  -- status devrait être 'finalized'
  ```
- ✅ Le CCTP est marqué comme finalisé et prêt à être exporté/utilisé

---

## 🔍 Vérifications dans la base de données

### Requêtes SQL utiles pour vérifier le flux complet

```sql
-- 1. Vérifier l'utilisateur créé
SELECT id, email, name, "createdAt" FROM users WHERE email = 'test@redyce.fr';

-- 2. Vérifier les projets de l'utilisateur
SELECT p.id, p.name, p.description, p."createdAt",
       COUNT(d.id) as document_count
FROM projects p
LEFT JOIN documents d ON d."projectId" = p.id
WHERE p."userId" = (SELECT id FROM users WHERE email = 'test@redyce.fr')
GROUP BY p.id;

-- 3. Vérifier les documents d'un projet
SELECT d.id, d.name, d."documentType", d.status, d."mimeType",
       d."fileSize", d."createdAt"
FROM documents d
WHERE d."projectId" = '[id-du-projet]'
ORDER BY d."createdAt" DESC;

-- 4. Vérifier les analyses d'un document
SELECT da.id, da."analysisType", da.status, da."createdAt",
       jsonb_pretty(da.result) as result_preview
FROM document_analyses da
WHERE da."documentId" = '[id-du-document]'
ORDER BY da."createdAt" DESC;

-- 5. Vérifier les DPGF extraits
SELECT dpgf.id, dpgf.title, dpgf.reference, dpgf.status,
       dpgf.confidence, dpgf."createdAt",
       jsonb_pretty(dpgf.data) as data_preview
FROM dpgf_structured dpgf
WHERE dpgf."projectId" = '[id-du-projet]'
ORDER BY dpgf."createdAt" DESC;

-- 6. Vérifier les CCTP générés
SELECT cctp.id, cctp.title, cctp.reference, cctp.status,
       cctp.version, cctp."createdAt",
       LEFT(cctp.content, 200) as content_preview
FROM cctp_generated cctp
WHERE cctp."projectId" = '[id-du-projet]'
ORDER BY cctp."createdAt" DESC;

-- 7. Vue d'ensemble complète du projet
SELECT 
  p.name as projet,
  COUNT(DISTINCT d.id) as nb_documents,
  COUNT(DISTINCT da.id) as nb_analyses,
  COUNT(DISTINCT dpgf.id) as nb_dpgf,
  COUNT(DISTINCT cctp.id) as nb_cctp
FROM projects p
LEFT JOIN documents d ON d."projectId" = p.id
LEFT JOIN document_analyses da ON da."documentId" = d.id
LEFT JOIN dpgf_structured dpgf ON dpgf."projectId" = p.id
LEFT JOIN cctp_generated cctp ON cctp."projectId" = p.id
WHERE p.id = '[id-du-projet]'
GROUP BY p.id, p.name;
```

---

## 🧪 Tests automatisés

### Configuration Playwright

Les tests automatisés utilisent **Playwright** pour tester le flux d'authentification et de base.

### Installation

```bash
# Les dépendances sont déjà installées dans package.json
# Installer les navigateurs (la première fois)
npx playwright install chromium
```

### Exécuter les tests

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter avec l'interface UI de Playwright
npm run test:e2e:ui

# Exécuter en mode headed (voir le navigateur)
npm run test:e2e:headed
```

### Tests disponibles

1. **`tests/e2e/auth.spec.ts`** - Tests d'authentification :
   - ✅ Affichage de la page de connexion
   - ✅ Affichage de la page d'inscription
   - ✅ Redirection vers `/projects` après connexion réussie
   - ✅ Affichage d'erreur avec identifiants invalides

2. **`tests/e2e/projects.spec.ts`** - Tests de gestion des projets :
   - ✅ Affichage de la page des projets
   - ✅ Création d'un projet via l'API

### Structure des tests

```
tests/
└── e2e/
    ├── auth.spec.ts      # Tests d'authentification
    └── projects.spec.ts  # Tests de projets
```

### Ajouter de nouveaux tests

Pour ajouter de nouveaux tests, créez un fichier dans `tests/e2e/` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mon nouveau test', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/ma-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Configuration

La configuration Playwright se trouve dans `playwright.config.ts`. Par défaut :
- Base URL : `http://localhost:3000`
- Serveur de développement lancé automatiquement avant les tests
- Navigateur : Chromium (peut être étendu à Firefox/WebKit)

---

## ✅ Checklist de validation

Avant de considérer que le flux fonctionne, vérifiez :

- [ ] ✅ Compte utilisateur créé avec succès
- [ ] ✅ Connexion fonctionne et redirige vers `/projects`
- [ ] ✅ Projet créé et visible dans la liste
- [ ] ✅ Document uploadé et visible dans la liste
- [ ] ✅ Document parsé (statut passe à "processed")
- [ ] ✅ DPGF extrait depuis le document
- [ ] ✅ DPGF visible avec données structurées
- [ ] ✅ CCTP généré depuis le DPGF
- [ ] ✅ CCTP affiche un contenu complet et formaté
- [ ] ✅ CCTP peut être finalisé
- [ ] ✅ Toutes les données sont bien liées à l'utilisateur connecté
- [ ] ✅ Aucun accès aux données d'autres utilisateurs

---

## 🐛 Dépannage

### Problème : Erreur 401 (Unauthorized)
- **Solution :** Vérifiez que vous êtes bien connecté. Essayez de vous déconnecter et reconnecter.

### Problème : Document ne se parse pas
- **Solution :** Vérifiez que le type MIME est supporté (PDF, DOCX, images). Vérifiez les logs du serveur.

### Problème : Extraction DPGF échoue
- **Solution :** Vérifiez que :
  1. Le document est bien parsé (statut = "processed")
  2. L'API OpenAI est configurée et fonctionne
  3. Le document contient bien du texte (pas une image scannée sans OCR)

### Problème : Génération CCTP échoue
- **Solution :** Vérifiez que :
  1. Un DPGF est bien extrait
  2. Le DPGF a un statut "extracted" ou "validated"
  3. L'API OpenAI est configurée

### Problème : Base de données non accessible
- **Solution :** Vérifiez que PostgreSQL est démarré et que `DATABASE_URL` est correct dans `.env.local`

---

## 📝 Notes importantes

1. **Isolation des données :** Tous les projets et documents sont isolés par utilisateur. Un utilisateur ne peut voir que ses propres données.

2. **Statuts des documents :**
   - `uploaded` : Fichier uploadé, pas encore traité
   - `processing` : En cours de parsing
   - `processed` : Parsé avec succès, prêt pour extraction
   - `error` : Erreur lors du traitement

3. **Statuts des DPGF :**
   - `extracted` : DPGF extrait avec succès
   - `validated` : DPGF validé manuellement
   - `archived` : DPGF archivé

4. **Statuts des CCTP :**
   - `draft` : Brouillon
   - `generated` : Généré par l'IA
   - `finalized` : Finalisé et validé
   - `archived` : Archivé

---

## 🎯 Prochaines étapes

Après avoir validé ce flux end-to-end, vous pouvez :
- Ajouter plus de tests automatisés
- Tester avec différents types de documents
- Tester avec plusieurs projets et utilisateurs
- Vérifier les performances avec de gros fichiers
- Tester les cas d'erreur (fichiers invalides, API OpenAI down, etc.)

