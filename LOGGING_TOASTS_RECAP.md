# Récapitulatif - Logging et Toasts

## ✅ Objectif atteint

Amélioration de la visibilité sur ce qui se passe dans Redyce avec :
- ✅ Système de logging côté serveur
- ✅ Logs intégrés dans toutes les routes API critiques
- ✅ Système de toasts/notifications côté client
- ✅ Toasts intégrés dans tous les hooks React

---

## 📁 Fichiers créés

### 1. `src/lib/logger.ts`
Utilitaire de logging côté serveur avec :
- `logInfo(message, meta?)` - Log d'information
- `logError(message, meta?)` - Log d'erreur
- `logWarn(message, meta?)` - Log d'avertissement
- `logDebug(message, meta?)` - Log de debug (dev uniquement)
- `logOperationStart(operation, meta?)` - Helper pour début d'opération
- `logOperationSuccess(operation, meta?)` - Helper pour succès
- `logOperationError(operation, error, meta?)` - Helper pour erreur

### 2. `src/lib/toast.ts`
Utilitaire de toast côté client avec :
- `toastSuccess(message, description?)` - Toast de succès
- `toastError(message, description?)` - Toast d'erreur
- `toastInfo(message, description?)` - Toast d'information
- `toastWarning(message, description?)` - Toast d'avertissement
- `toastLoading(message)` - Toast de chargement

---

## 📝 Fichiers modifiés

### Routes API (avec logs)

1. **`src/app/api/documents/upload/route.ts`**
   - ✅ Log au début : userId, projectId, fileName, fileSize, mimeType, documentType
   - ✅ Log en cas de succès : documentId, fileName, fileSize
   - ✅ Log en cas d'erreur : message + stack

2. **`src/app/api/documents/[id]/parse/route.ts`**
   - ✅ Log au début : userId, documentId
   - ✅ Log en cas de succès : userId, documentId, analysisId, status
   - ✅ Log en cas d'erreur : message + stack

3. **`src/app/api/dpgf/extract/route.ts`**
   - ✅ Log au début : userId, documentId, model, temperature
   - ✅ Log en cas de succès : userId, documentId, dpgfId, title, confidence
   - ✅ Log en cas d'erreur : message + stack

4. **`src/app/api/cctp/generate/route.ts`**
   - ✅ Log au début : userId, source (DPGF/Documents), dpgfId, projectId, etc.
   - ✅ Log en cas de succès : userId, cctpId, source, status, version
   - ✅ Log en cas d'erreur : message + stack

5. **`src/app/api/cctp/[id]/finalize/route.ts`**
   - ✅ Log au début : userId, cctpId
   - ✅ Log en cas de succès : userId, cctpId, status, version
   - ✅ Log en cas d'erreur : message + stack

### Hooks React (avec toasts)

1. **`src/hooks/useDocumentUpload.ts`**
   - ✅ Toast de succès lors de l'upload réussi
   - ✅ Toast d'erreur en cas d'échec

2. **`src/hooks/useDPGF.ts`**
   - ✅ Toast de succès lors de l'extraction DPGF
   - ✅ Toast de succès lors de la mise à jour DPGF
   - ✅ Toast d'erreur en cas d'échec

3. **`src/hooks/useCCTP.ts`**
   - ✅ Toast de succès lors de la génération CCTP (depuis DPGF ou documents)
   - ✅ Toast de succès lors de la finalisation CCTP
   - ✅ Toast de succès lors de la création d'une nouvelle version
   - ✅ Toast d'erreur en cas d'échec

### Providers

1. **`src/components/providers/Providers.tsx`**
   - ✅ Ajout du composant `<Toaster />` de Sonner

### Dépendances

- ✅ `sonner` ajouté à `package.json`

---

## 📊 Exemples de logs côté serveur

### Exemple 1 : Upload de document réussi

```
[2024-12-12T10:30:45.123Z] INFO  [START] Document Upload | {"userId":"clx123abc","projectId":"clx456def","fileName":"DPGF_renovation.pdf","fileSize":2456789,"mimeType":"application/pdf","documentType":"DPGF"}

[2024-12-12T10:30:45.456Z] INFO  [SUCCESS] Document Upload | {"userId":"clx123abc","projectId":"clx456def","documentId":"clx789ghi","fileName":"DPGF_renovation_1234567890.pdf","fileSize":2456789}
```

### Exemple 2 : Extraction DPGF avec erreur

```
[2024-12-12T10:35:20.789Z] INFO  [START] DPGF Extract | {"userId":"clx123abc","documentId":"clx789ghi","model":"gpt-4","temperature":0.3}

[2024-12-12T10:35:25.123Z] ERROR [ERROR] DPGF Extract | {"userId":"clx123abc","documentId":"clx789ghi","error":"Document must be processed before DPGF extraction","stack":"Error: Document must be processed before DPGF extraction\n    at DPGFService.extractDPGFFromDocument (/path/to/dpgf-service.ts:38:15)\n    ..."}
  Stack: Error: Document must be processed before DPGF extraction
    at DPGFService.extractDPGFFromDocument (/path/to/dpgf-service.ts:38:15)
    ...
```

### Exemple 3 : Génération CCTP réussie

```
[2024-12-12T10:40:10.234Z] INFO  [START] CCTP Generate | {"userId":"clx123abc","source":"DPGF","dpgfId":"clx999xyz","projectId":"clx456def","hasUserRequirements":true,"hasAdditionalContext":false}

[2024-12-12T10:40:45.567Z] INFO  [SUCCESS] CCTP Generate | {"userId":"clx123abc","cctpId":"clx111aaa","source":"DPGF","dpgfId":"clx999xyz","projectId":"clx456def","status":"generated","version":1}
```

### Exemple 4 : Finalisation CCTP

```
[2024-12-12T10:45:30.890Z] INFO  [START] CCTP Finalize | {"userId":"clx123abc","cctpId":"clx111aaa"}

[2024-12-12T10:45:31.123Z] INFO  [SUCCESS] CCTP Finalize | {"userId":"clx123abc","cctpId":"clx111aaa","status":"finalized","version":1}
```

---

## 🎨 Exemples de toasts côté UI

### Exemple 1 : Upload de document réussi

**Toast affiché :**
```
✅ Document uploadé avec succès
   Le fichier "DPGF_renovation.pdf" a été uploadé.
```

**Apparence :**
- Fond vert clair
- Icône de succès (✓)
- Position : en haut à droite
- Durée : 4 secondes

### Exemple 2 : Erreur lors de l'upload

**Toast affiché :**
```
❌ Erreur lors de l'upload
   File size exceeds maximum of 52428800 bytes
```

**Apparence :**
- Fond rouge clair
- Icône d'erreur (✕)
- Position : en haut à droite
- Durée : 5 secondes

### Exemple 3 : Extraction DPGF réussie

**Toast affiché :**
```
✅ DPGF extrait avec succès
   Le DPGF "Rénovation École Primaire" a été extrait.
```

### Exemple 4 : Génération CCTP réussie

**Toast affiché :**
```
✅ CCTP généré avec succès
   Le CCTP "CCTP - Projet Test Rénovation" a été généré.
```

### Exemple 5 : Finalisation CCTP

**Toast affiché :**
```
✅ CCTP finalisé
   Le CCTP a été finalisé et est prêt à être utilisé.
```

### Exemple 6 : Erreur lors de la génération CCTP

**Toast affiché :**
```
❌ Erreur lors de la génération CCTP
   DPGF must be extracted or validated before generating CCTP
```

---

## 🔍 Utilisation

### Côté serveur (dans les routes API)

```typescript
import { logOperationStart, logOperationSuccess, logOperationError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = await requireAuth()
  const { documentId } = await request.json()

  logOperationStart('My Operation', { userId, documentId })

  try {
    // ... logique métier ...
    
    logOperationSuccess('My Operation', { userId, documentId, resultId: result.id })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logOperationError('My Operation', error as Error, { userId, documentId })
    return NextResponse.json({ success: false, error: { message: '...' } })
  }
}
```

### Côté client (dans les composants/hooks)

```typescript
import { toastSuccess, toastError } from '@/lib/toast'

// Succès
toastSuccess('Opération réussie', 'Description optionnelle')

// Erreur
toastError('Erreur', 'Message d\'erreur détaillé')
```

---

## 📋 Checklist

- ✅ Logger créé avec formatage clair
- ✅ Logs intégrés dans toutes les routes API critiques
- ✅ Système de toast installé (Sonner)
- ✅ Toaster ajouté au layout
- ✅ Toasts intégrés dans useDocumentUpload
- ✅ Toasts intégrés dans useDPGF
- ✅ Toasts intégrés dans useCCTP
- ✅ Format de log cohérent avec timestamp et métadonnées
- ✅ Stack traces affichées pour les erreurs
- ✅ Messages de toast clairs et informatifs

---

## 🎯 Résultat

**Côté serveur :** Tous les logs sont maintenant formatés de manière cohérente avec timestamp, niveau, message et métadonnées. Facilite le debugging et le monitoring.

**Côté client :** Les utilisateurs reçoivent des notifications visuelles claires pour chaque action (succès ou erreur), améliorant l'expérience utilisateur.

