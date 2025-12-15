# Résumé - Sécurisation API Redyce V1

## ✅ Changements effectués

### 1. **Utilitaires de sécurité** (`src/lib/utils/project-access.ts`)
- `requireAuth()` : Récupère userId depuis session serveur
- `requireProjectAccess(projectId, userId?)` : Vérifie l'accès au projet

### 2. **Client Prisma** (`src/lib/prisma/client.ts`)
- Corrigé : Utilise `memoire` au lieu de `technicalMemo`
- Validation du modèle `Memoire` au chargement

### 3. **Service TechnicalMemo** (`src/services/technical-memo-service.ts`)
- Corrigé : Utilise `prisma.memoire` partout
- **GARDE-FOU template obligatoire** : Vérifie qu'un document `MODELE_MEMOIRE` existe avant création
- Si `templateDocumentId` non fourni, utilise automatiquement le premier `MODELE_MEMOIRE` du projet

### 4. **Routes API sécurisées**
- `POST /api/projects` : userId depuis session serveur
- `POST /api/memos` : Vérifie template `MODELE_MEMOIRE` obligatoire
- `POST /api/documents/upload` : Vérifie accès projet avec `requireProjectAccess()`

## 📍 Emplacement du garde-fou "Template obligatoire"

**Fichier** : `src/services/technical-memo-service.ts`
**Méthode** : `createMemo()`
**Lignes** : ~65-90

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
```

## 📋 Exemples de payloads

### 1. `POST /api/projects`
```json
{
  "name": "Projet Test",
  "description": "Description optionnelle"
}
```

### 2. `POST /api/documents/upload` (FormData)
```
file: File
projectId: "clx..."
documentType: "MODELE_MEMOIRE" | "AE" | "RC" | "CCAP" | "CCTP" | "DPGF" | "AUTRE"
```

### 3. `POST /api/memos`
```json
{
  "projectId": "clx...",
  "title": "Mémoire technique V1",
  "templateDocumentId": "clx..." // Optionnel
}
```

**Erreur si pas de template (400):**
```json
{
  "success": false,
  "error": {
    "message": "Aucun modèle de mémoire (MODELE_MEMOIRE) trouvé pour ce projet. Veuillez d'abord uploader un document de type MODELE_MEMOIRE dans ce projet."
  }
}
```

## 📁 Fichiers modifiés

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

## 🔒 Sécurité

✅ userId toujours depuis session serveur (jamais depuis le client)  
✅ Vérification d'accès projet sur toutes les opérations  
✅ Template `MODELE_MEMOIRE` obligatoire pour créer un mémoire  
✅ Type document validé par Zod

