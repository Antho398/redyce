# Guide d'Utilisation des Parsers

## Vue d'ensemble

Le système de parsing supporte maintenant trois types de documents :
- **PDF** : Extraction de texte et métadonnées
- **DOCX** : Extraction de texte avec conservation du formatage HTML
- **Images** : OCR avec Tesseract.js (JPEG, PNG, GIF)

## Utilisation du Parser Unifié

### Méthode recommandée : `parseDocument()`

```typescript
import { parseDocument } from '@/lib/documents/parser'

// Exemple avec un PDF
const pdfBuffer = Buffer.from(/* votre fichier PDF */)
const result = await parseDocument(pdfBuffer, 'application/pdf')

console.log(result.type) // 'pdf'
console.log(result.data.text) // Texte extrait
```

### Exemple complet

```typescript
import { parseDocument, detectMimeTypeFromFilename } from '@/lib/documents/parser'
import { promises as fs } from 'fs'

async function parseFile(filePath: string) {
  // Lire le fichier
  const buffer = await fs.readFile(filePath)
  
  // Détecter le type MIME depuis le nom de fichier
  const mimeType = detectMimeTypeFromFilename(filePath)
  
  if (!mimeType) {
    throw new Error('Type de fichier non supporté')
  }
  
  // Parser le document
  const result = await parseDocument(buffer, mimeType)
  
  // Traiter selon le type
  switch (result.type) {
    case 'pdf':
      console.log(`PDF: ${result.data.text.length} caractères`)
      console.log(`Pages: ${result.data.metadata.pages}`)
      break
      
    case 'docx':
      console.log(`DOCX: ${result.data.text.length} caractères`)
      if (result.data.html) {
        console.log('HTML disponible:', result.data.html.substring(0, 100))
      }
      break
      
    case 'image':
      console.log(`Image: ${result.data.text.length} caractères`)
      console.log(`Confiance OCR: ${(result.data.confidence * 100).toFixed(1)}%`)
      break
  }
  
  return result
}
```

## Utilisation avec DocumentProcessor

### Méthode recommandée pour l'application

```typescript
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { DOCUMENT_TYPES } from '@/config/constants'

const processor = new DocumentProcessor()

// Traiter un document (PDF, DOCX ou image)
const result = await processor.processDocument(
  buffer,
  mimeType, // 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', etc.
  DOCUMENT_TYPES.DPGF // Type de document métier (optionnel)
)

console.log(result.documentType)
console.log(result.extractedContent.text)
console.log(result.extractedContent.metadata)
```

## Parsers Individuels

### Parser PDF

```typescript
import { parsePDF } from '@/lib/documents/parser'

const pdfBuffer = Buffer.from(/* votre PDF */)
const result = await parsePDF(pdfBuffer)

console.log(result.text)
console.log(result.metadata.pages)
console.log(result.pages) // Tableau de pages
```

### Parser DOCX

```typescript
import { parseDOCX } from '@/lib/documents/parser'

const docxBuffer = Buffer.from(/* votre DOCX */)
const result = await parseDOCX(docxBuffer)

console.log(result.text) // Texte brut
console.log(result.html) // HTML avec formatage
console.log(result.sections) // Sections détectées
```

### Parser Images (OCR)

```typescript
import { parseImage } from '@/lib/documents/parser'

const imageBuffer = Buffer.from(/* votre image */)
const result = await parseImage(imageBuffer)

console.log(result.text) // Texte extrait via OCR
console.log(result.confidence) // Score de confiance (0-1)
console.log(result.metadata.width, result.metadata.height)
console.log(result.ocrData.words) // Mots avec positions
```

**Note**: L'OCR peut être lent pour les grandes images. Le parser optimise automatiquement l'image (niveaux de gris, normalisation, netteté) pour améliorer les résultats.

## Détection du Type MIME

```typescript
import { detectMimeTypeFromFilename } from '@/lib/documents/parser'

const mimeType = detectMimeTypeFromFilename('document.pdf')
// Retourne: 'application/pdf'

const mimeType2 = detectMimeTypeFromFilename('document.docx')
// Retourne: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const mimeType3 = detectMimeTypeFromFilename('image.jpg')
// Retourne: 'image/jpeg'
```

## Gestion des Erreurs

```typescript
import { parseDocument } from '@/lib/documents/parser'

try {
  const result = await parseDocument(buffer, mimeType)
} catch (error) {
  if (error.message.includes('Unsupported MIME type')) {
    console.error('Type de fichier non supporté')
  } else if (error.message.includes('Failed to parse')) {
    console.error('Erreur lors du parsing:', error.message)
  } else {
    console.error('Erreur inconnue:', error)
  }
}
```

## Types Supportés

### Types MIME supportés

- `application/pdf` - Fichiers PDF
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - DOCX
- `application/msword` - DOC (ancien format Word)
- `image/jpeg` - Images JPEG
- `image/png` - Images PNG
- `image/gif` - Images GIF

### Extensions de fichiers détectées

- `.pdf` → PDF
- `.docx` → DOCX
- `.doc` → DOC
- `.jpg`, `.jpeg` → JPEG
- `.png` → PNG
- `.gif` → GIF

## Performance

### Temps d'exécution approximatifs

- **PDF** : ~50-200ms pour un document moyen (10 pages)
- **DOCX** : ~100-300ms pour un document moyen
- **Images OCR** : ~2-5 secondes pour une image HD (selon la taille et le contenu texte)

### Optimisations

- Les images sont automatiquement optimisées avant OCR (niveaux de gris, normalisation)
- L'OCR utilise le français et l'anglais par défaut (`fra+eng`)
- Pour de meilleures performances OCR, préférez des images de bonne qualité avec un texte clair

## Exemples d'Intégration

### Dans une route API Next.js

```typescript
// app/api/documents/parse/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { fileStorage } from '@/lib/documents/storage'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const documentType = formData.get('documentType') as string
  
  const buffer = Buffer.from(await file.arrayBuffer())
  const processor = new DocumentProcessor()
  
  const result = await processor.processDocument(
    buffer,
    file.type,
    documentType
  )
  
  return NextResponse.json({ success: true, data: result })
}
```

### Dans un service

```typescript
import { DocumentProcessor } from '@/lib/documents/processors/document-processor'
import { fileStorage } from '@/lib/documents/storage'

class DocumentService {
  private processor = new DocumentProcessor()
  
  async processDocument(documentId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } })
    const buffer = await fileStorage.readFile(document.filePath)
    
    const result = await this.processor.processDocument(
      buffer,
      document.mimeType,
      document.documentType
    )
    
    // Sauvegarder le résultat
    await prisma.documentAnalysis.create({
      data: {
        documentId,
        analysisType: 'extraction',
        status: 'completed',
        result: result as any,
      },
    })
    
    return result
  }
}
```

