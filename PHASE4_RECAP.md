# Phase 4 - Récapitulatif : Services Métier

## ✅ Phase 4 Terminée

### Fichiers Créés

#### Services
1. **`src/services/dpgf-service.ts`**
   - Service complet pour la gestion des DPGF structurés
   - Extraction depuis documents
   - CRUD complet
   - Validation

2. **`src/services/cctp-service.ts`**
   - Service complet pour la génération et gestion de CCTP
   - Génération depuis DPGF structuré
   - Génération depuis documents bruts
   - Gestion des versions
   - Finalisation

---

## 📝 Récapitulatif des Fichiers

### Fichiers Nouveaux (2)
- `src/services/dpgf-service.ts`
- `src/services/cctp-service.ts`

---

## 🚀 Utilisation des Services

### 1. DPGFService

#### Extraire un DPGF depuis un document

```typescript
import { dpgfService } from '@/services/dpgf-service'

const dpgf = await dpgfService.extractDPGFFromDocument(
  documentId,
  userId,
  {
    model: 'gpt-4-turbo-preview', // Optionnel
    temperature: 0.3, // Optionnel
  }
)

console.log(dpgf.title)
console.log(dpgf.data) // Données structurées
console.log(dpgf.confidence) // Score de confiance
```

#### Récupérer les DPGF d'un projet

```typescript
const dpgfs = await dpgfService.getProjectDPGFs(projectId, userId)
```

#### Récupérer un DPGF par ID

```typescript
const dpgf = await dpgfService.getDPGFById(dpgfId, userId)
```

#### Mettre à jour un DPGF

```typescript
const updated = await dpgfService.updateDPGF(dpgfId, userId, {
  title: 'Nouveau titre',
  reference: 'REF-001',
  status: 'validated',
})
```

#### Valider un DPGF

```typescript
const validation = await dpgfService.validateDPGF(dpgfId, userId)
console.log(validation.valid)
console.log(validation.errors)
console.log(validation.warnings)
```

#### Supprimer un DPGF

```typescript
await dpgfService.deleteDPGF(dpgfId, userId)
```

### 2. CCTPService

#### Générer un CCTP depuis un DPGF

```typescript
import { cctpService } from '@/services/cctp-service'

const cctp = await cctpService.generateCCTPFromDPGF(
  dpgfId,
  userId,
  {
    userRequirements: 'Exigences spécifiques...', // Optionnel
    additionalContext: 'Contexte supplémentaire...', // Optionnel
    model: 'gpt-4-turbo-preview', // Optionnel
    temperature: 0.7, // Optionnel
  }
)

console.log(cctp.title)
console.log(cctp.content) // Texte formaté
console.log(cctp.structure) // Structure JSON
```

#### Générer un CCTP depuis des documents bruts

```typescript
const cctp = await cctpService.generateCCTPFromDocuments(
  projectId,
  userId,
  {
    userRequirements: 'Exigences...',
    additionalContext: 'Contexte...',
  }
)
```

#### Récupérer les CCTP d'un projet

```typescript
const cctps = await cctpService.getProjectCCTPs(projectId, userId)
```

#### Récupérer un CCTP par ID

```typescript
const cctp = await cctpService.getCCTPById(cctpId, userId)
```

#### Créer une nouvelle version

```typescript
// Si le CCTP a un DPGF source, régénère depuis le DPGF
// Sinon, crée une copie en version supérieure
const newVersion = await cctpService.createNewVersion(cctpId, userId)
```

#### Finaliser un CCTP

```typescript
// Valide et passe le statut à "finalized"
const finalized = await cctpService.finalizeCCTP(cctpId, userId)
```

#### Mettre à jour un CCTP

```typescript
const updated = await cctpService.updateCCTP(cctpId, userId, {
  title: 'Nouveau titre',
  content: 'Nouveau contenu',
  status: 'draft',
})
```

#### Supprimer un CCTP

```typescript
await cctpService.deleteCCTP(cctpId, userId)
```

---

## 🔍 Méthodes Disponibles

### DPGFService

- `extractDPGFFromDocument()` - Extraction depuis un document traité
- `getProjectDPGFs()` - Liste des DPGF d'un projet
- `getDPGFById()` - Récupérer un DPGF
- `updateDPGF()` - Mettre à jour un DPGF
- `deleteDPGF()` - Supprimer un DPGF
- `validateDPGF()` - Valider et changer le statut

### CCTPService

- `generateCCTPFromDPGF()` - Générer depuis DPGF structuré
- `generateCCTPFromDocuments()` - Générer depuis documents bruts
- `getProjectCCTPs()` - Liste des CCTP d'un projet
- `getCCTPById()` - Récupérer un CCTP
- `updateCCTP()` - Mettre à jour un CCTP
- `createNewVersion()` - Créer une nouvelle version
- `finalizeCCTP()` - Finaliser un CCTP
- `deleteCCTP()` - Supprimer un CCTP

---

## 🔄 Workflow Typique

### 1. Extraction DPGF

```typescript
// 1. Upload et parsing du document
const document = await documentService.createDocument({...})
await documentService.processDocument(document.id, userId)

// 2. Extraction DPGF
const dpgf = await dpgfService.extractDPGFFromDocument(document.id, userId)

// 3. Validation
const validation = await dpgfService.validateDPGF(dpgf.id, userId)
if (validation.valid) {
  await dpgfService.updateDPGF(dpgf.id, userId, { status: 'validated' })
}
```

### 2. Génération CCTP

```typescript
// 1. Depuis DPGF (recommandé)
const cctp = await cctpService.generateCCTPFromDPGF(dpgf.id, userId, {
  userRequirements: 'Exigences spécifiques...',
})

// 2. Révision et modification si nécessaire
await cctpService.updateCCTP(cctp.id, userId, {
  content: 'Contenu modifié...',
})

// 3. Finalisation
await cctpService.finalizeCCTP(cctp.id, userId)
```

---

## 🛡️ Sécurité et Validation

### Vérifications d'Accès

Toutes les méthodes vérifient que:
- L'utilisateur a accès au projet
- L'utilisateur a accès au document/DPGF/CCTP
- Les ressources existent

### Validation Automatique

- **DPGF**: Validation automatique lors de l'extraction et de la mise à jour
- **CCTP**: Validation avant finalisation

### Gestion d'Erreurs

Les services lèvent des erreurs typées:
- `NotFoundError` - Ressource non trouvée
- `UnauthorizedError` - Accès non autorisé
- `Error` - Autres erreurs métier

---

## 📊 Statuts

### DPGF
- `extracted` - Extrait (défaut)
- `validated` - Validé
- `archived` - Archivé

### CCTP
- `draft` - Brouillon
- `generated` - Généré
- `finalized` - Finalisé
- `archived` - Archivé

---

## ✅ Validation

- ✅ Pas d'erreurs de linting
- ✅ Types TypeScript corrects
- ✅ Intégration avec pipelines IA
- ✅ Validation automatique
- ✅ Gestion d'erreurs complète
- ✅ Vérifications de sécurité

---

**Phase 4 terminée avec succès !** 🎉

Les services métier sont prêts pour intégration dans les routes API.

