# Assistant IA contextuel pour sections - Implémentation

## Résumé

Implémentation complète du pipeline IA "assistant de section" qui utilise le contexte complet du projet (exigences, documents, profil entreprise) pour générer des propositions contextuelles.

## Route API

### POST `/api/ia/section`
- **Body** :
  ```typescript
  {
    memoireId: string (cuid)
    sectionId: string (cuid)
    action: 'improve' | 'rewrite' | 'complete' | 'explain'
    tone?: 'professional' | 'technical' | 'concise' | 'detailed'
    length?: 'short' | 'medium' | 'long'
  }
  ```
- **Response** :
  ```typescript
  {
    success: true
    data: {
      proposition: string
      citations: Array<{
        documentId: string
        documentName: string
        page?: number
        quote?: string
      }>
    }
  }
  ```

- **Authentification** : Requise (session serveur)
- **Rate limiting** : 10 requêtes par minute par utilisateur (en mémoire)
- **Gestion d'erreurs** :
  - 401 : Non authentifié
  - 400 : Erreur de validation Zod
  - 403 : Pas d'accès au mémoire
  - 429 : Rate limit dépassé
  - 503 : Clé API manquante ou erreur OpenAI (quota, clé invalide)

## Service

### `section-ai-service.ts`
- **`generateSectionProposal()`** :
  - Vérifie les permissions (mémoire appartient à l'utilisateur)
  - Récupère le contexte complet :
    - Exigences du projet (20 plus récentes)
    - Documents traités (AE, RC, CCAP, CCTP, DPGF) avec extraits
    - Profil entreprise (nom + description du projet)
  - Construit le prompt selon l'action
  - Génère la réponse avec `gpt-4o-mini`
  - Extrait les citations depuis les documents utilisés

- **`buildContext()`** :
  - Récupère les exigences pertinentes
  - Extrait les textes des documents analysés (max 2000 caractères par document)
  - Construit le profil entreprise depuis les infos du projet

- **`buildPrompt()`** :
  - Instructions selon l'action (improve/rewrite/complete/explain)
  - Instructions de ton (professional/technical/concise/detailed)
  - Instructions de longueur (short/medium/long)
  - Contenu actuel de la section
  - Exigences du projet (10 premières)
  - Extraits de documents (max 1000 caractères par document)
  - Profil entreprise

- **`getSystemPrompt()`** :
  - Prompt système adapté selon l'action
  - Instructions pour utiliser le contexte

- **`extractCitations()`** :
  - Extrait les citations depuis les documents utilisés
  - Retourne documentId, documentName, quote (200 premiers caractères)

## Validation Zod

### Schémas ajoutés (`src/lib/utils/validation.ts`)
- `sectionAIActionSchema` :
  - `memoireId` (cuid, required)
  - `sectionId` (cuid, required)
  - `action` (enum: improve, rewrite, complete, explain, required)
  - `tone` (enum: professional, technical, concise, detailed, optional)
  - `length` (enum: short, medium, long, optional)

## UI

### Panneau IA mis à jour (`/projects/[id]/memoire/[memoireId]/page.tsx`)
- **Actions** :
  - "Améliorer" : Améliore le contenu existant (nécessite du contenu)
  - "Reformuler" : Réécrit complètement (nécessite du contenu)
  - "Compléter" : Complète le contenu (fonctionne même si vide)
  - "Expliquer" : Explique le sujet (fonctionne même si vide)

- **Affichage de la proposition** :
  - Zone scrollable avec la proposition générée
  - Bouton "Copier" avec feedback visuel
  - Bouton "Appliquer dans l'éditeur" qui remplace le contenu

- **Citations** :
  - Section "Sources" affichant les documents utilisés
  - Nom du document + extrait (quote)

- **États** :
  - Loading pendant la génération
  - Désactivation des boutons pendant le chargement
  - Messages d'erreur via toast

## Rate Limiting

### Implémentation simple (en mémoire)
- **Window** : 1 minute
- **Max** : 10 requêtes par utilisateur
- **Storage** : Map en mémoire (pour production, utiliser Redis)
- **Response** : 429 si limite dépassée

## Gestion d'erreurs

### Erreurs gérées
1. **Clé API manquante** : 503 "AI service not configured"
2. **Quota OpenAI dépassé** : 503 avec message d'erreur
3. **Clé API invalide** : 503 avec message d'erreur
4. **Rate limit** : 429 "Rate limit exceeded"
5. **Permissions** : 403 "You do not have access"
6. **Validation** : 400 avec détails Zod

## Fichiers créés/modifiés

### Créés
1. `src/app/api/ia/section/route.ts` - Route API avec rate limiting et gestion d'erreurs
2. `src/services/section-ai-service.ts` - Service IA avec contexte complet
3. `IA_SECTION_ASSISTANT.md` (ce fichier)

### Modifiés
1. `src/lib/utils/validation.ts` - Ajout `sectionAIActionSchema`
2. `src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx` - Panneau IA avec proposition + citations

## Tests manuels

### 1. Génération de proposition
1. Aller sur `/projects/[id]/memoire/[memoireId]`
2. Sélectionner une section
3. Cliquer sur "Améliorer" ou "Compléter"
4. Vérifier que la proposition apparaît dans le panneau IA
5. Vérifier que les citations sont affichées

### 2. Appliquer la proposition
1. Générer une proposition
2. Cliquer sur "Appliquer dans l'éditeur"
3. Vérifier que le contenu de l'éditeur est remplacé
4. Vérifier l'autosave

### 3. Copier la proposition
1. Générer une proposition
2. Cliquer sur l'icône "Copier"
3. Vérifier le feedback visuel (check vert)
4. Coller ailleurs → Vérifier que le texte est correct

### 4. Rate limiting
1. Faire 10 requêtes rapides
2. La 11ème doit retourner 429
3. Attendre 1 minute → La requête doit fonctionner

### 5. Gestion d'erreurs
1. Tester sans clé API → Doit retourner 503
2. Tester avec section inexistante → Doit retourner 403/404
3. Tester avec validation invalide → Doit retourner 400

## Notes importantes

- ✅ **Contexte complet** : Le prompt inclut exigences + documents + profil entreprise
- ✅ **Citations** : Les documents sources sont listés avec extraits
- ✅ **Rate limiting** : Protection contre l'abus (10 req/min)
- ✅ **Gestion d'erreurs** : Messages clairs pour toutes les erreurs possibles
- ⚠️ **Rate limiting en mémoire** : Pour production, utiliser Redis ou un service dédié
- 🔄 **Usage tracking** : Commenté pour l'instant, à activer si nécessaire
- 📝 **Modèle** : Utilise `gpt-4o-mini` pour réduire les coûts

