# Récapitulatif - Collaboration sur les Mémoires Techniques

## ✅ Fichiers créés/modifiés

### 1. **Migration Prisma** (nouveau)
- `prisma/migrations/20241216000004_add_collaboration/migration.sql`
- Tables `project_members` et `comments`
- Colonnes `validatedBy` et `validatedAt` sur `memoire_sections`

### 2. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Modèle `ProjectMember` ajouté :
  - `id`, `projectId`, `userId`
  - `role` (OWNER, CONTRIBUTOR, REVIEWER)
  - Unique sur `(projectId, userId)`
- ✅ Modèle `Comment` ajouté :
  - `id`, `memoireSectionId`, `authorId`
  - `parentCommentId` (pour les réponses)
  - `content`
- ✅ `MemoireSection` modifié :
  - `status` peut être `VALIDATED`
  - `validatedBy` (userId)
  - `validatedAt` (DateTime)
  - Relation `comments`

### 3. **Service** (`src/services/collaboration-service.ts`) - NOUVEAU
- ✅ `getUserRole` : Récupère le rôle d'un utilisateur sur un projet
- ✅ `addProjectMember` : Ajoute un membre à un projet (OWNER uniquement)
- ✅ `getProjectMembers` : Liste tous les membres d'un projet
- ✅ `createComment` : Crée un commentaire sur une section
- ✅ `getSectionComments` : Récupère tous les commentaires d'une section
- ✅ `validateSection` : Valide une section (REVIEWER ou OWNER)

### 4. **Routes API** (nouvelles)
- `GET /api/projects/[id]/members` : Liste les membres d'un projet
- `POST /api/projects/[id]/members` : Ajoute un membre (OWNER uniquement)
- `POST /api/comments` : Crée un commentaire
- `GET /api/sections/[id]/comments` : Liste les commentaires d'une section
- `POST /api/sections/[id]/validate` : Valide une section (REVIEWER/OWNER)

### 5. **Composant UI** (`src/components/memoire/SectionComments.tsx`) - NOUVEAU
- ✅ Affichage des commentaires et réponses
- ✅ Formulaire d'ajout de commentaire
- ✅ Formulaire de réponse à un commentaire
- ✅ Bouton "Valider" (si REVIEWER ou OWNER)
- ✅ Badge "Validé" si section validée

### 6. **UI Éditeur** (`src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx`)
- ✅ Intégration de `SectionComments` dans le panneau droit
- ✅ Récupération du rôle utilisateur via `fetchUserRole`
- ✅ Passe `sectionStatus` et `userRole` au composant

## Fonctionnalités implémentées

### Rôles

**OWNER** (propriétaire du projet) :
- Tout faire : éditer, commenter, valider, exporter, ajouter des membres

**CONTRIBUTOR** :
- Éditer les sections
- Commenter

**REVIEWER** :
- Commenter
- Marquer une section comme validée

### Commentaires

- Commentaires attachés à une section
- Réponses aux commentaires (thread)
- Affichage dans un panneau latéral
- Indicateur de statut par section : "À relire" ou "Validé"

### Validation

- Seuls REVIEWER et OWNER peuvent valider
- Validation stockée avec `validatedBy` et `validatedAt`
- Status de la section passe à `VALIDATED`

## Migration

### Commande à exécuter

```bash
# Appliquer la migration
npx prisma migrate deploy

# OU directement avec SQL
psql -d redyce -f prisma/migrations/20241216000004_add_collaboration/migration.sql

# Générer le client Prisma
npx prisma generate
```

### Contenu de la migration

La migration crée :
- Table `project_members` avec rôles
- Table `comments` avec support des réponses (parentCommentId)
- Colonnes `validatedBy` et `validatedAt` sur `memoire_sections`
- Index et foreign keys nécessaires

## Endpoints disponibles

### GET /api/projects/[id]/members
**Description** : Liste tous les membres d'un projet (inclut le propriétaire)

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "projectId": "...",
      "userId": "...",
      "role": "OWNER",
      "user": { "id": "...", "name": "...", "email": "..." }
    },
    ...
  ]
}
```

### POST /api/projects/[id]/members
**Description** : Ajoute un membre au projet (OWNER uniquement)

**Body** :
```json
{
  "userId": "...",
  "role": "CONTRIBUTOR" | "REVIEWER"
}
```

### POST /api/comments
**Description** : Crée un commentaire

**Body** :
```json
{
  "memoireSectionId": "...",
  "content": "...",
  "parentCommentId": "..." // Optionnel pour une réponse
}
```

### GET /api/sections/[id]/comments
**Description** : Liste les commentaires d'une section (avec réponses)

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "content": "...",
      "author": { "id": "...", "name": "...", "email": "..." },
      "replies": [...]
    },
    ...
  ]
}
```

### POST /api/sections/[id]/validate
**Description** : Valide une section (REVIEWER ou OWNER uniquement)

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "VALIDATED",
    "validatedBy": "...",
    "validatedAt": "..."
  }
}
```

## Checklist de test

### Test 1 : Ajouter un membre
- [ ] Aller sur `/projects/[id]`
- [ ] Appeler `POST /api/projects/[id]/members` avec `userId` et `role` (CONTRIBUTOR ou REVIEWER)
- [ ] Vérifier que le membre apparaît dans `GET /api/projects/[id]/members`
- [ ] Essayer d'ajouter un membre en tant que CONTRIBUTOR → doit échouer (403)

### Test 2 : Ajouter un commentaire
- [ ] Ouvrir l'éditeur d'un mémoire
- [ ] Sélectionner une section
- [ ] Dans le panneau droit, écrire un commentaire
- [ ] Cliquer "Ajouter un commentaire"
- [ ] Vérifier que le commentaire s'affiche

### Test 3 : Répondre à un commentaire
- [ ] Cliquer "Répondre" sur un commentaire existant
- [ ] Écrire une réponse
- [ ] Cliquer "Envoyer"
- [ ] Vérifier que la réponse s'affiche en dessous du commentaire parent

### Test 4 : Valider une section (REVIEWER)
- [ ] Se connecter avec un compte REVIEWER
- [ ] Ouvrir l'éditeur d'un mémoire
- [ ] Sélectionner une section
- [ ] Vérifier que le bouton "Valider" est visible
- [ ] Cliquer "Valider"
- [ ] Vérifier que le badge "Validé" s'affiche
- [ ] Vérifier que le statut de la section est `VALIDATED` dans la DB

### Test 5 : Valider une section (OWNER)
- [ ] Se connecter avec le propriétaire du projet
- [ ] Vérifier que le bouton "Valider" est visible
- [ ] Valider une section
- [ ] Vérifier que ça fonctionne

### Test 6 : Permissions
- [ ] CONTRIBUTOR ne peut pas valider → bouton "Valider" non visible
- [ ] CONTRIBUTOR peut commenter → formulaire de commentaire visible
- [ ] CONTRIBUTOR peut éditer les sections

## Points d'attention

- ⚠️ **Propriétaire** : Le propriétaire du projet (`project.userId`) a toujours le rôle OWNER (pas stocké dans `project_members`)
- ✅ **Rôles** : Vérifiés côté API, pas de permissions fines
- ✅ **Commentaires** : Pas de chat global, uniquement attachés aux sections
- ✅ **Validation** : Simple (statut + userId + date), pas de workflow complexe
- ⚠️ **UI** : Le panneau de commentaires remplace temporairement l'AIPanel. Pour avoir les deux, il faudrait modifier le layout en 4 colonnes ou ajouter des onglets.

## Structure de données

### ProjectMember (Prisma)
```prisma
model ProjectMember {
  id        String   @id
  projectId String
  userId    String
  role      String   @default("CONTRIBUTOR") // OWNER, CONTRIBUTOR, REVIEWER
  project   Project  @relation(...)
  user      User     @relation(...)
  @@unique([projectId, userId])
}
```

### Comment (Prisma)
```prisma
model Comment {
  id              String   @id
  memoireSectionId String
  authorId        String
  parentCommentId String?
  content         String   @db.Text
  section         MemoireSection @relation(...)
  author          User           @relation(...)
  parentComment   Comment?       @relation("CommentReplies", ...)
  replies         Comment[]      @relation("CommentReplies")
}
```

### MemoireSection (modifié)
```prisma
model MemoireSection {
  // ... champs existants
  status      String   @default("DRAFT") // DRAFT, IN_PROGRESS, COMPLETED, VALIDATED
  validatedBy String?
  validatedAt DateTime?
  comments    Comment[]
}
```

## Améliorations futures

- [ ] Interface pour ajouter des membres depuis l'UI (modal avec sélection d'utilisateur)
- [ ] Notifications simples (nouvelles réponses, validation)
- [ ] Afficher à la fois commentaires ET IA (onglets ou 4 colonnes)
- [ ] Indicateur "À relire" dans la liste des sections
- [ ] Liste des sections avec statut de validation
- [ ] Mentions dans les commentaires (@utilisateur)
