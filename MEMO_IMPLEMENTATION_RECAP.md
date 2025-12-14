# Implémentation Mémoires Techniques - Récapitulatif

## 📋 Vue d'ensemble

Implémentation complète du système de gestion des mémoires techniques selon la vision produit Redyce :
- **Mémoire technique** = Livrable principal (document généré/édité)
- **Template client** = Obligatoire pour créer un mémoire (contient les questions/sections)
- **Versionning simple** (V1 pour l'instant)

---

## 🗄️ Modèle de données

### Schéma Prisma `TechnicalMemo`

```prisma
model TechnicalMemo {
  id                 String   @id @default(cuid())
  projectId          String
  userId             String
  title              String
  status             String   @default("DRAFT") // DRAFT, IN_PROGRESS, READY, EXPORTED
  templateDocumentId String   // Document template obligatoire
  contentJson        Json?    // Contenu structuré (sections/réponses)
  contentText        String?  @db.Text // Version texte pour recherche
  version            Int      @default(1)
  metadata           Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  template Document @relation("TechnicalMemoTemplate", fields: [templateDocumentId], references: [id], onDelete: Restrict)
  
  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@index([templateDocumentId])
  @@index([createdAt])
  @@map("technical_memos")
}
```

**Relations :**
- `project` : Relation vers Project (CASCADE delete)
- `user` : Relation vers User (CASCADE delete)
- `template` : Relation vers Document (RESTRICT delete - protection du template)

**Migration :** `20251214074144_add_technical_memo`

---

## 🔌 API Routes

Toutes les routes utilisent `getServerSession` pour l'authentification (pas de userId côté client).

### GET `/api/memos`
- **Query params :** `projectId?`, `status?`, `q?` (recherche)
- **Retourne :** Liste des mémoires de l'utilisateur filtrés
- **Auth :** Session serveur obligatoire

### POST `/api/memos`
- **Body :** `{ projectId, templateDocumentId, title }`
- **Retourne :** Mémoire créé
- **Validation :** Zod `createTechnicalMemoSchema`
- **Auth :** Session serveur obligatoire

### GET `/api/memos/[id]`
- **Retourne :** Détails d'un mémoire
- **Auth :** Vérification que le mémoire appartient à l'utilisateur

### PUT `/api/memos/[id]`
- **Body :** `{ title?, status?, contentJson?, contentText? }`
- **Retourne :** Mémoire mis à jour
- **Validation :** Zod `updateTechnicalMemoSchema`

### POST `/api/memos/[id]/generate`
- **Génération IA** (stub pour l'instant)
- **Retourne :** Mémoire avec contenu généré

### POST `/api/memos/[id]/export`
- **Body :** `{ format: 'DOCX' | 'PDF' }`
- **Export** (stub pour l'instant)
- **Validation :** Le mémoire doit être READY

---

## 🎨 UI Pages

### Page globale : `/memoire`

**Fonctionnalités :**
- Liste de tous les mémoires (tous projets confondus)
- Filtres : recherche textuelle, statut
- Table avec colonnes : Titre, Projet, Statut, Date, Actions
- CTA "Créer un mémoire" → redirige vers `/projects`

**Design :**
- Compact, professionnel
- Badges de statut colorés
- Liens vers projets et mémoires

### Page projet : `/projects/[id]/memoire`

**Fonctionnalités :**
- Liste des mémoires du projet uniquement
- Dialog "Créer un mémoire" :
  - Sélection du template parmi les documents du projet (type `MODELE_MEMOIRE`)
  - Champ titre obligatoire
  - Validation avant création
- Empty state si aucun template disponible → CTA vers documents
- Empty state si aucun mémoire → CTA créer

**Design :**
- Cohérent avec la page globale
- Messages d'erreur clairs
- Validation inline

---

## 🪝 Hook React `useMemos`

**Emplacement :** `src/hooks/useMemos.ts`

**Usage :**
```typescript
const { memos, loading, error, refetch, createMemo, updateMemo, generateMemo, exportMemo } = useMemos({
  projectId?: string,
  status?: 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'EXPORTED',
  search?: string
})
```

**Fonctions :**
- `memos` : Liste des mémoires
- `loading` : État de chargement
- `error` : Message d'erreur
- `refetch()` : Recharger la liste
- `createMemo(data)` : Créer un nouveau mémoire
- `updateMemo(id, data)` : Mettre à jour un mémoire
- `generateMemo(id)` : Générer le contenu IA
- `exportMemo(id, format)` : Exporter le mémoire

---

## 🔐 Sécurité

- ✅ **Toujours filtrer par `session.user.id`** (jamais de userId côté client)
- ✅ **Vérification d'accès** : Un utilisateur ne peut accéder qu'à ses propres mémoires
- ✅ **Vérification de projet** : Le template doit appartenir au projet
- ✅ **Validation Zod** : Tous les inputs sont validés
- ✅ **Retour 401** : Si pas de session

---

## 📁 Fichiers créés/modifiés

### Backend
- ✅ `prisma/schema.prisma` - Ajout modèle `TechnicalMemo`
- ✅ `prisma/migrations/20251214074144_add_technical_memo/` - Migration
- ✅ `src/services/technical-memo-service.ts` - Service métier
- ✅ `src/lib/utils/validation.ts` - Schémas Zod
- ✅ `src/app/api/memos/route.ts` - Routes GET/POST liste
- ✅ `src/app/api/memos/[id]/route.ts` - Routes GET/PUT détail
- ✅ `src/app/api/memos/[id]/generate/route.ts` - Génération IA
- ✅ `src/app/api/memos/[id]/export/route.ts` - Export DOCX/PDF

### Frontend
- ✅ `src/hooks/useMemos.ts` - Hook React
- ✅ `src/app/(dashboard)/memoire/page.tsx` - Page globale
- ✅ `src/app/(dashboard)/projects/[id]/memoire/page.tsx` - Page projet
- ✅ `src/components/ui/dialog.tsx` - Composant Dialog (Radix UI)
- ✅ `src/components/ui/label.tsx` - Composant Label (Radix UI)
- ✅ `src/components/ui/select.tsx` - Composant Select (Radix UI) mis à jour
- ✅ `src/components/layout/Sidebar.tsx` - Lien vers `/memoire`

---

## 🚀 Workflow utilisateur

### Créer un mémoire

1. **Uploader un template** (document type `MODELE_MEMOIRE`) sur `/projects/[id]/documents`
2. **Aller sur** `/projects/[id]/memoire`
3. **Cliquer** "Créer un mémoire"
4. **Sélectionner** le template dans la liste
5. **Renseigner** le titre
6. **Valider** → Mémoire créé avec statut `DRAFT`

### Gérer les mémoires

- **Page globale** `/memoire` : Vue d'ensemble tous projets
- **Page projet** `/projects/[id]/memoire` : Vue spécifique au projet
- **Filtres** : Recherche, statut
- **Navigation** : Liens vers projets, liens vers détails (à implémenter)

---

## 📝 Prochaines étapes (stubs)

Les fonctionnalités suivantes sont stubées et prêtes pour l'implémentation :

1. **Génération IA** (`POST /api/memos/[id]/generate`)
   - Utiliser les exigences extraites (Requirements)
   - Utiliser les sections du template (MemorySection)
   - Générer le contenu structuré

2. **Export DOCX/PDF** (`POST /api/memos/[id]/export`)
   - Générer un fichier DOCX/PDF à partir du `contentJson`
   - Utiliser le template comme structure
   - Stocker le fichier exporté

3. **Page détail mémoire** (`/projects/[id]/memoire/[memoId]`)
   - Édition du contenu
   - Visualisation structurée
   - Actions : Générer, Exporter, Sauvegarder

---

## ✅ Contraintes respectées

- ✅ Template obligatoire pour créer un mémoire
- ✅ Toujours filtrer par `session.user.id`
- ✅ Jamais de `userId` accepté depuis le client
- ✅ Empty state clair si aucun template
- ✅ Navigation cohérente (sidebar + onglets projet)
- ✅ Design compact et professionnel
- ✅ Validation Zod complète
- ✅ Gestion d'erreurs propre

---

## 🧪 Tests recommandés

1. **Créer un mémoire** : Vérifier que le template est obligatoire
2. **Filtres** : Tester recherche et filtres par statut
3. **Sécurité** : Vérifier qu'un utilisateur ne peut pas accéder aux mémoires d'un autre
4. **Empty states** : Vérifier les messages clairs
5. **Validation** : Tester les erreurs de validation Zod

---

## 📚 Références

- **Schéma Prisma** : `prisma/schema.prisma`
- **Service** : `src/services/technical-memo-service.ts`
- **Routes API** : `src/app/api/memos/**`
- **Pages UI** : `src/app/(dashboard)/memoire/**` et `src/app/(dashboard)/projects/[id]/memoire/**`
- **Hook** : `src/hooks/useMemos.ts`

