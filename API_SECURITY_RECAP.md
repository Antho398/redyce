# Récapitulatif - Sécurisation API Redyce V1

## Changements effectués

### 1. Utilitaire de sécurité (`src/lib/utils/project-access.ts`)
- ✅ `requireAuth()` : Récupère userId depuis session serveur
- ✅ `requireProjectAccess(projectId, userId?)` : Vérifie l'accès au projet

### 2. Client Prisma (`src/lib/prisma/client.ts`)
- ✅ Corrigé : Utilise `memoire` au lieu de `technicalMemo`
- ✅ Validation du modèle `Memoire` au chargement

### 3. Service TechnicalMemo (`src/services/technical-memo-service.ts`)
- ✅ Corrigé : Utilise `prisma.memoire` partout
- ✅ **GARDE-FOU template obligatoire** : Vérifie qu'un document `MODELE_MEMOIRE` existe avant création
- ✅ Si `templateDocumentId` non fourni, utilise automatiquement le premier `MODELE_MEMOIRE` du projet
- ✅ Vérifie que le template appartient au projet et est bien de type `MODELE_MEMOIRE`

### 4. Routes API

#### `POST /api/projects`
- ✅ Utilise `userId` depuis session serveur (jamais depuis le client)
- ✅ Logs nettoyés

#### `POST /api/memos` (création mémoire)
- ✅ Utilise `requireAuth()` pour userId
- ✅ Le service vérifie automatiquement le template `MODELE_MEMOIRE` obligatoire

#### `POST /api/documents/upload`
- ✅ Utilise `requireProjectAccess()` pour vérifier l'accès au projet
- ✅ Type document obligatoire (validé par Zod)

### 5. Autres fichiers corrigés
- ✅ `src/services/section-ai-service.ts` : `prisma.memoire`
- ✅ `src/app/api/memos/[id]/sections/route.ts` : `prisma.memoire`
- ✅ `src/app/api/memos/[id]/sections/[sectionId]/route.ts` : `prisma.memoire`

## Garde-fous "Template obligatoire"

### Emplacement : `src/services/technical-memo-service.ts:createMemo()`

```typescript
// GARDE-FOU : Vérifier qu'un document MODELE_MEMOIRE existe pour ce projet
const templateExists = await prisma.document.findFirst({
  where: {
    projectId: data.projectId,
    documentType: 'MODELE_MEMOIRE',
  },
})

if (!templateExists) {
  throw new Error(
    'Aucun modèle de mémoire (MODELE_MEMOIRE) trouvé pour ce projet. ' +
    'Veuillez d\'abord uploader un document de type MODELE_MEMOIRE dans ce projet.'
  )
}

// Si templateDocumentId est fourni, vérifier qu'il est bien MODELE_MEMOIRE
if (template.documentType !== 'MODELE_MEMOIRE') {
  throw new Error(
    `Le document sélectionné n'est pas de type MODELE_MEMOIRE (type actuel: ${template.documentType})`
  )
}
```

## Exemples de payloads

### 1. `POST /api/projects`

**Request:**
```json
{
  "name": "Projet Test",
  "description": "Description optionnelle"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Projet Test",
    "description": "Description optionnelle",
    "userId": "clx...", // Depuis la session
    "createdAt": "2024-12-15T10:00:00.000Z"
  }
}
```

### 2. `POST /api/documents/upload`

**Request (FormData):**
```
file: File (PDF/DOCX/...)
projectId: "clx..."
documentType: "MODELE_MEMOIRE" | "AE" | "RC" | "CCAP" | "CCTP" | "DPGF" | "AUTRE"
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "documentId": "clx...",
    "fileName": "template-memoire.docx",
    "fileSize": 12345,
    "status": "uploaded"
  }
}
```

### 3. `POST /api/memos` (création mémoire)

**Request:**
```json
{
  "projectId": "clx...",
  "title": "Mémoire technique V1",
  "templateDocumentId": "clx..." // Optionnel : si non fourni, utilise le premier MODELE_MEMOIRE
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "Mémoire technique V1",
    "status": "DRAFT",
    "projectId": "clx...",
    "templateDocumentId": "clx...",
    "project": { "id": "...", "name": "..." },
    "template": { "id": "...", "name": "..." }
  }
}
```

**Erreur si pas de template MODELE_MEMOIRE (400):**
```json
{
  "success": false,
  "error": {
    "message": "Aucun modèle de mémoire (MODELE_MEMOIRE) trouvé pour ce projet. Veuillez d'abord uploader un document de type MODELE_MEMOIRE dans ce projet."
  }
}
```

## Sécurité

### Règles appliquées

1. **userId toujours depuis session serveur** : Jamais accepté depuis le client
2. **Vérification d'accès projet** : Toutes les opérations vérifient que l'utilisateur possède le projet
3. **Template obligatoire** : Impossible de créer un mémoire sans document `MODELE_MEMOIRE`
4. **Type document validé** : Zod valide les types de documents

### Fonctions de sécurité

- `requireAuth()` : userId depuis session
- `requireProjectAccess(projectId, userId?)` : Vérifie possession du projet
- Service `createMemo()` : Vérifie template `MODELE_MEMOIRE` obligatoire

## Fichiers modifiés

1. `src/lib/utils/project-access.ts` (nouveau)
2. `src/lib/prisma/client.ts`
3. `src/services/technical-memo-service.ts`
4. `src/services/section-ai-service.ts`
5. `src/app/api/projects/route.ts`
6. `src/app/api/memos/route.ts`
7. `src/app/api/memos/[id]/sections/route.ts`
8. `src/app/api/memos/[id]/sections/[sectionId]/route.ts`
9. `src/app/api/documents/upload/route.ts`
10. `src/lib/utils/validation.ts`

