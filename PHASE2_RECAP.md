# Phase 2 - Récapitulatif : Parsers DOCX et Images

## ✅ Phase 2 Terminée

### Fichiers Créés

#### Parsers
1. **`src/lib/documents/parser/docx-parser.ts`**
   - Parseur DOCX utilisant `mammoth`
   - Extraction texte et HTML
   - Détection de sections

2. **`src/lib/documents/parser/docx-parser.types.ts`**
   - Types TypeScript pour le parsing DOCX
   - Interfaces `DOCXMetadata`, `ParsedDOCX`, `DOCXSection`

3. **`src/lib/documents/parser/image-parser.ts`**
   - Parseur d'images avec OCR via `tesseract.js`
   - Support JPEG, PNG, GIF
   - Optimisation automatique des images pour OCR
   - Extraction de métadonnées avec `sharp`

4. **`src/lib/documents/parser/image-parser.types.ts`**
   - Types TypeScript pour le parsing d'images
   - Interfaces `ImageMetadata`, `ParsedImage`

5. **`src/lib/documents/parser/unified-parser.ts`**
   - Parser unifié qui route vers le bon parser selon le type MIME
   - Fonction `parseDocument()` - méthode principale
   - Fonction `detectMimeTypeFromFilename()` - détection automatique

6. **`src/lib/documents/parser/unified-parser.types.ts`**
   - Types unifiés pour tous les parsers
   - Type union `ParsedDocument`
   - Interface `ParserResult`

7. **`src/lib/documents/parser/__tests__/parser.test.ts`**
   - Tests basiques pour les parsers
   - Tests de détection MIME type
   - Structure pour tests futurs avec fichiers réels

8. **`src/lib/documents/parser/USAGE.md`**
   - Documentation complète d'utilisation
   - Exemples de code
   - Guide d'intégration

#### Modifications

9. **`src/lib/documents/parser/index.ts`**
   - Ajout des exports pour DOCX, images et parser unifié
   - Export de tous les types

10. **`src/lib/documents/processors/document-processor.ts`**
    - Mise à jour pour utiliser le parser unifié
    - Support multi-format (PDF, DOCX, images)
    - Compatibilité préservée avec l'existant (PDF toujours supporté)

11. **`src/services/document-service.ts`**
    - Mise à jour de `processDocument()` pour utiliser le nouveau parser
    - Support des nouveaux types MIME
    - Validation des types supportés

12. **`src/types/documents.ts`**
    - Ajout de `width`, `height`, `format` dans `DocumentMetadata`

13. **`package.json`**
    - Ajout dépendances : `mammoth`, `sharp`, `tesseract.js`
    - Suppression de `@types/mammoth` (non nécessaire)

---

## 📝 Récapitulatif des Fichiers

### Fichiers Nouveaux (8)
- `src/lib/documents/parser/docx-parser.ts`
- `src/lib/documents/parser/docx-parser.types.ts`
- `src/lib/documents/parser/image-parser.ts`
- `src/lib/documents/parser/image-parser.types.ts`
- `src/lib/documents/parser/unified-parser.ts`
- `src/lib/documents/parser/unified-parser.types.ts`
- `src/lib/documents/parser/__tests__/parser.test.ts`
- `src/lib/documents/parser/USAGE.md`

### Fichiers Modifiés (5)
- `src/lib/documents/parser/index.ts`
- `src/lib/documents/processors/document-processor.ts`
- `src/services/document-service.ts`
- `src/types/documents.ts`
- `package.json`

---

## 🚀 Utilisation des Parsers

### 1. Parser Unifié (Méthode Recommandée)

```typescript
import { parseDocument, detectMimeTypeFromFilename } from '@/lib/documents/parser'
import { promises as fs } from 'fs'

// Lire un fichier
const buffer = await fs.readFile('document.pdf')

// Détecter le type MIME automatiquement
const mimeType = detectMimeTypeFromFilename('document.pdf')
// ou spécifier manuellement
const mimeType = 'application/pdf'

// Parser le document
const result = await parseDocument(buffer, mimeType)

// Accéder aux résultats
console.log(result.type) // 'pdf', 'docx', ou 'image'
console.log(result.data.text) // Texte extrait

// Traiter selon le type
if (result.type === 'pdf') {
  const pdf = result.data
  console.log(`Pages: ${pdf.metadata.pages}`)
} else if (result.type === 'docx') {
  const docx = result.data
  console.log(`HTML: ${docx.html?.substring(0, 100)}`)
} else if (result.type === 'image') {
  const image = result.data
  console.log(`Confiance OCR: ${(image.confidence * 100).toFixed(1)}%`)
}
```

### 2. Parser PDF (Usage Direct)

```typescript
import { parsePDF } from '@/lib/documents/parser'

const buffer = Buffer.from(/* votre PDF */)
const result = await parsePDF(buffer)

console.log(result.text) // Texte complet
console.log(result.metadata.pages) // Nombre de pages
console.log(result.pages) // Array de pages [{ pageNumber, text }]
```

### 3. Parser DOCX (Usage Direct)

```typescript
import { parseDOCX } from '@/lib/documents/parser'

const buffer = Buffer.from(/* votre DOCX */)
const result = await parseDOCX(buffer)

console.log(result.text) // Texte brut
console.log(result.html) // HTML avec formatage
console.log(result.sections) // Sections détectées [{ level, title?, content }]
```

### 4. Parser Images avec OCR (Usage Direct)

```typescript
import { parseImage } from '@/lib/documents/parser'

const buffer = Buffer.from(/* votre image */)
const result = await parseImage(buffer)

console.log(result.text) // Texte extrait via OCR
console.log(result.confidence) // Score 0-1
console.log(result.metadata.width, result.metadata.height)
console.log(result.ocrData.words) // Détails des mots avec positions
```

### 5. Utilisation avec DocumentProcessor

```typescript
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { DOCUMENT_TYPES } from '@/config/constants'

const processor = new DocumentProcessor()

// Traiter un document (PDF, DOCX ou image)
const result = await processor.processDocument(
  buffer,
  'application/pdf', // ou 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', etc.
  DOCUMENT_TYPES.DPGF // Type métier (optionnel)
)

// Résultat unifié
console.log(result.documentType)
console.log(result.extractedContent.text)
console.log(result.extractedContent.metadata)
console.log(result.extractedContent.sections)
```

---

## 🔍 Types MIME Supportés

| Type MIME | Extension | Parser |
|-----------|-----------|--------|
| `application/pdf` | `.pdf` | PDF Parser |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` | DOCX Parser |
| `application/msword` | `.doc` | DOCX Parser |
| `image/jpeg` | `.jpg`, `.jpeg` | Image Parser (OCR) |
| `image/png` | `.png` | Image Parser (OCR) |
| `image/gif` | `.gif` | Image Parser (OCR) |

---

## ⚙️ Fonctionnalités

### Parser PDF
- ✅ Extraction de texte complet
- ✅ Métadonnées (pages, titre, auteur, dates)
- ✅ Division par pages
- ✅ Compatible avec extracteurs existants (CCTP, DPGF, RC, CCAP)

### Parser DOCX
- ✅ Extraction de texte brut
- ✅ Conservation du formatage HTML
- ✅ Détection automatique de sections
- ✅ Estimation du nombre de pages

### Parser Images (OCR)
- ✅ OCR avec Tesseract.js (français + anglais)
- ✅ Optimisation automatique (niveaux de gris, normalisation, netteté)
- ✅ Extraction de métadonnées (dimensions, format)
- ✅ Score de confiance OCR
- ✅ Détails des mots avec positions (bounding boxes)

### Parser Unifié
- ✅ Détection automatique du type MIME
- ✅ Routing vers le bon parser
- ✅ Interface unifiée pour tous les types
- ✅ Gestion d'erreurs centralisée

---

## 🧪 Tests

Les tests basiques sont dans `src/lib/documents/parser/__tests__/parser.test.ts`.

Pour exécuter les tests :
```bash
npm test parser.test.ts
```

**Note**: Les tests avec fichiers réels sont commentés. Pour les activer, ajoutez des fichiers de test dans `test-files/`.

---

## 🔧 Configuration

### Dépendances Ajoutées

```json
{
  "mammoth": "^1.6.0",        // Parser DOCX
  "sharp": "^0.33.0",         // Traitement images
  "tesseract.js": "^5.0.4"    // OCR
}
```

### Langues OCR

Par défaut, Tesseract utilise le français et l'anglais (`fra+eng`). Pour modifier :
```typescript
// Dans image-parser.ts
const worker = await createWorker('fra+eng') // Modifier ici
```

---

## ⚠️ Notes Importantes

1. **OCR peut être lent** : Comptez 2-5 secondes pour une image HD. Utilisez des workers pour éviter de bloquer le serveur.

2. **Compatibilité préservée** : Tous les code existant fonctionne toujours. Le `DocumentProcessor` utilise maintenant le parser unifié mais reste compatible avec l'ancien code.

3. **Optimisation images** : Les images sont automatiquement optimisées pour l'OCR (niveaux de gris, normalisation, netteté).

4. **Gestion d'erreurs** : Tous les parsers lancent des erreurs descriptives en cas d'échec.

---

## ✅ Validation

- ✅ Pas d'erreurs de linting
- ✅ Types TypeScript corrects
- ✅ Compatibilité avec l'existant préservée
- ✅ Documentation complète
- ✅ Tests basiques créés

---

**Phase 2 terminée avec succès !** 🎉

Prêt pour validation avant de passer à la Phase 3.

