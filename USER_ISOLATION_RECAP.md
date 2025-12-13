# Récapitulatif - Isolation des données par utilisateur

## ✅ Objectif atteint

Tous les projets et documents sont maintenant **isolés par utilisateur**. Chaque utilisateur ne voit et ne peut manipuler que ses propres données.

---

## 📊 Schéma des relations Prisma

```
User (1) ────────< (N) Project (1) ────────< (N) Document
  │                    │                         │
  │                    ├─> Memory                ├─> DocumentAnalysis
  │                    ├─> DPGFStructured        ├─> KnowledgeChunk
  │                    ├─> CCTPGenerated         └─> DPGFStructured
  │                    └─> ChatMessage
  │
  └─> ChatMessage
```

### Relations détaillées :

1. **User → Project** (1-N)
   - `Project.userId` : String (obligatoire)
   - Relation : `onDelete: Cascade`
   - Tous les projets sont liés à un utilisateur unique

2. **Project → Document** (1-N)
   - `Document.projectId` : String (obligatoire)
   - Relation : `onDelete: Cascade`
   - Tous les documents appartiennent à un projet

3. **Vérification en cascade** :
   - Pour accéder à un document, on vérifie qu'il appartient à un projet
   - On vérifie ensuite que le projet appartient à l'utilisateur connecté

---

## 🔒 Sécurité et isolation des données

### Helpers d'authentification

#### `src/lib/auth/session.ts` (existant)
- `getCurrentUserId()` : Récupère l'ID utilisateur depuis la session
- `getCurrentSession()` : Récupère la session complète NextAuth
- `requireAuth()` : **Requis pour toutes les routes API** - Lance une erreur si non authentifié

#### `src/lib/auth/getCurrentUser.ts` (nouveau)
- `getCurrentUser()` : Récupère les données complètes de l'utilisateur depuis la DB
- `requireUser()` : Récupère l'utilisateur ou lance une erreur

### Vérifications dans les services

Tous les services métier vérifient l'accès utilisateur :

1. **ProjectService** (`src/services/project-service.ts`)
   - ✅ `getUserProjects(userId)` : Filtre par userId
   - ✅ `getProjectById(projectId, userId)` : Vérifie que le projet appartient à l'utilisateur
   - ✅ `updateProject(projectId, userId, data)` : Vérifie l'accès avant modification
   - ✅ `deleteProject(projectId, userId)` : Vérifie l'accès avant suppression

2. **DocumentService** (`src/services/document-service.ts`)
   - ✅ `createDocument(data)` : Vérifie que le projet appartient à l'utilisateur
   - ✅ `getUserDocuments(userId)` : **NOUVEAU** - Récupère tous les documents de l'utilisateur
   - ✅ `getProjectDocuments(projectId, userId)` : Vérifie l'accès au projet
   - ✅ `getDocumentById(documentId, userId)` : Vérifie l'accès via le projet parent
   - ✅ `processDocument(documentId, userId)` : Vérifie l'accès avant traitement
   - ✅ `deleteDocument(documentId, userId)` : Vérifie l'accès avant suppression

3. **DPGFService** (`src/services/dpgf-service.ts`)
   - ✅ Toutes les méthodes vérifient l'accès via le document/projet parent

4. **CCTPService** (`src/services/cctp-service.ts`)
   - ✅ Toutes les méthodes vérifient l'accès via le projet parent

---

## 📁 Fichiers modifiés

### Nouveaux fichiers

1. **`src/lib/auth/getCurrentUser.ts`**
   - Helper supplémentaire pour récupérer l'utilisateur complet depuis la DB
   - Fournit `getCurrentUser()` et `requireUser()`

### Fichiers modifiés

1. **`src/services/document-service.ts`**
   - ✅ Ajout de la méthode `getUserDocuments(userId)` pour récupérer tous les documents d'un utilisateur

2. **`src/app/api/documents/route.ts`**
   - ✅ Implémentation complète de `GET /api/documents`
   - ✅ Utilise `requireAuth()` pour vérifier l'authentification
   - ✅ Appelle `documentService.getUserDocuments(userId)` pour filtrer par utilisateur
   - ✅ `POST /api/documents` retourne maintenant une erreur explicite (utiliser `/api/documents/upload`)

---

## 🔐 Routes API sécurisées

Toutes les routes API suivantes utilisent `requireAuth()` :

### Projets
- ✅ `GET /api/projects` - Liste des projets de l'utilisateur
- ✅ `POST /api/projects` - Création d'un projet (lié à l'utilisateur)
- ✅ `GET /api/projects/[id]` - Récupère un projet (vérifie l'accès)
- ✅ `PUT /api/projects/[id]` - Met à jour un projet (vérifie l'accès)
- ✅ `DELETE /api/projects/[id]` - Supprime un projet (vérifie l'accès)
- ✅ `GET /api/projects/[id]/documents` - Documents d'un projet (vérifie l'accès)

### Documents
- ✅ `GET /api/documents` - **NOUVEAU** - Liste tous les documents de l'utilisateur
- ✅ `POST /api/documents/upload` - Upload d'un document (vérifie l'accès au projet)
- ✅ `GET /api/documents/[id]` - Récupère un document (vérifie l'accès)
- ✅ `DELETE /api/documents/[id]` - Supprime un document (vérifie l'accès)
- ✅ `POST /api/documents/[id]/parse` - Traite un document (vérifie l'accès)

### DPGF
- ✅ `GET /api/dpgf` - Liste les DPGF de l'utilisateur
- ✅ `POST /api/dpgf/extract` - Extraction DPGF (vérifie l'accès au document)
- ✅ `GET /api/dpgf/[id]` - Récupère un DPGF (vérifie l'accès)
- ✅ `PUT /api/dpgf/[id]` - Met à jour un DPGF (vérifie l'accès)
- ✅ `DELETE /api/dpgf/[id]` - Supprime un DPGF (vérifie l'accès)

### CCTP
- ✅ `GET /api/cctp` - Liste les CCTP de l'utilisateur
- ✅ `POST /api/cctp/generate` - Génération CCTP (vérifie l'accès)
- ✅ `GET /api/cctp/[id]` - Récupère un CCTP (vérifie l'accès)
- ✅ `PUT /api/cctp/[id]` - Met à jour un CCTP (vérifie l'accès)
- ✅ `DELETE /api/cctp/[id]` - Supprime un CCTP (vérifie l'accès)

### Autres
- ✅ Toutes les routes `/api/ai/*` utilisent `requireAuth()`
- ✅ Toutes les routes `/api/*` protégées par middleware NextAuth

---

## 📝 Exemple d'utilisation

### Créer un projet lié à l'utilisateur connecté

```typescript
// Client-side
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mon projet',
    description: 'Description du projet'
  })
})

// Côté serveur (route.ts)
export async function POST(request: NextRequest) {
  const userId = await requireAuth() // ✅ Authentification requise
  const data = await request.json()
  
  // Le service crée automatiquement le projet avec userId
  const project = await projectService.createProject(userId, data)
  // Le projet est maintenant lié à l'utilisateur connecté
}
```

### Récupérer tous les projets de l'utilisateur

```typescript
// Client-side
const response = await fetch('/api/projects')
const { data: projects } = await response.json()
// ✅ Seuls les projets de l'utilisateur connecté sont retournés

// Côté serveur (route.ts)
export async function GET() {
  const userId = await requireAuth()
  // ✅ Filtre automatiquement par userId
  const projects = await projectService.getUserProjects(userId)
}
```

### Récupérer tous les documents de l'utilisateur

```typescript
// Client-side
const response = await fetch('/api/documents')
const { data: documents } = await response.json()
// ✅ Seuls les documents des projets de l'utilisateur sont retournés

// Côté serveur (route.ts)
export async function GET() {
  const userId = await requireAuth()
  // ✅ Filtre automatiquement via la relation Project → User
  const documents = await documentService.getUserDocuments(userId)
}
```

### Vérifier l'accès à une ressource

```typescript
// Dans un service
async getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })
  
  if (!project) {
    throw new NotFoundError('Project', projectId)
  }
  
  // ✅ Vérification de propriété
  if (project.userId !== userId) {
    throw new UnauthorizedError('You do not have access to this project')
  }
  
  return project
}
```

---

## 🛡️ Protection par couches

L'isolation des données est assurée à plusieurs niveaux :

1. **Middleware NextAuth** (`src/middleware.ts`)
   - Protège toutes les routes API et pages dashboard
   - Redirige vers `/login` si non authentifié

2. **Routes API**
   - Toutes utilisent `requireAuth()` comme première ligne
   - Retournent 401 si non authentifié

3. **Services métier**
   - Vérifient toujours l'accès utilisateur avant toute opération
   - Utilisent `userId` pour filtrer les requêtes Prisma
   - Lancent `UnauthorizedError` si accès refusé

4. **Base de données**
   - Relations Prisma avec `onDelete: Cascade`
   - Index sur `userId` et `projectId` pour performance
   - Pas de requête globale sans filtrage par utilisateur

---

## ✅ Tests recommandés

Pour vérifier que l'isolation fonctionne correctement :

1. **Créer deux utilisateurs** (via `/register`)
2. **Connecter le premier utilisateur** et créer un projet
3. **Se déconnecter et connecter le second utilisateur**
4. **Essayer d'accéder au projet du premier utilisateur** via `/api/projects/[id]`
   - ✅ Devrait retourner 401 ou 404 (accès refusé)
5. **Vérifier que `/api/projects` ne retourne que les projets du second utilisateur**
6. **Vérifier que `/api/documents` ne retourne que les documents du second utilisateur**

---

## 📋 Checklist de sécurité

- ✅ Toutes les routes API utilisent `requireAuth()`
- ✅ Tous les services vérifient l'accès utilisateur
- ✅ Aucune requête Prisma sans filtrage par `userId`
- ✅ Relations Prisma correctement configurées
- ✅ Middleware NextAuth actif
- ✅ Errors 401/403 correctement gérées
- ✅ Cascade delete configuré pour éviter les orphelins

---

## 🎉 Résultat

**Tous les projets et documents sont maintenant complètement isolés par utilisateur.**
Chaque utilisateur ne peut voir, créer, modifier ou supprimer que ses propres données.

