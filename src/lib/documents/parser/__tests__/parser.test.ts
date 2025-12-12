/**
 * Tests basiques pour les parseurs
 * Ces tests vérifient que les parseurs peuvent être appelés sans erreur
 * Note: Pour des tests complets, il faudrait des fichiers de test réels
 */

import { parsePDF } from '../pdf-parser'
import { parseDOCX } from '../docx-parser'
import { parseImage } from '../image-parser'
import { parseDocument, detectMimeTypeFromFilename } from '../unified-parser'

describe('Parsers', () => {
  describe('detectMimeTypeFromFilename', () => {
    it('should detect PDF MIME type', () => {
      expect(detectMimeTypeFromFilename('document.pdf')).toBe('application/pdf')
    })

    it('should detect DOCX MIME type', () => {
      expect(detectMimeTypeFromFilename('document.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })

    it('should detect DOC MIME type', () => {
      expect(detectMimeTypeFromFilename('document.doc')).toBe('application/msword')
    })

    it('should detect JPEG MIME type', () => {
      expect(detectMimeTypeFromFilename('image.jpg')).toBe('image/jpeg')
      expect(detectMimeTypeFromFilename('image.jpeg')).toBe('image/jpeg')
    })

    it('should detect PNG MIME type', () => {
      expect(detectMimeTypeFromFilename('image.png')).toBe('image/png')
    })

    it('should detect GIF MIME type', () => {
      expect(detectMimeTypeFromFilename('image.gif')).toBe('image/gif')
    })

    it('should return null for unsupported file types', () => {
      expect(detectMimeTypeFromFilename('file.txt')).toBeNull()
      expect(detectMimeTypeFromFilename('file.unknown')).toBeNull()
    })
  })

  describe('parseDocument', () => {
    it('should throw error for unsupported MIME type', async () => {
      const buffer = Buffer.from('test')
      await expect(
        parseDocument(buffer, 'text/plain')
      ).rejects.toThrow('Unsupported MIME type')
    })
  })

  // Note: Les tests suivants nécessiteraient des fichiers réels
  // Ils sont commentés mais peuvent être utilisés avec des fichiers de test
  
  /*
  describe('parsePDF', () => {
    it('should parse a valid PDF', async () => {
      const pdfBuffer = fs.readFileSync('test-files/sample.pdf')
      const result = await parsePDF(pdfBuffer)
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('metadata')
      expect(result.metadata).toHaveProperty('pages')
    })
  })

  describe('parseDOCX', () => {
    it('should parse a valid DOCX', async () => {
      const docxBuffer = fs.readFileSync('test-files/sample.docx')
      const result = await parseDOCX(docxBuffer)
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('metadata')
    })
  })

  describe('parseImage', () => {
    it('should parse a valid image with OCR', async () => {
      const imageBuffer = fs.readFileSync('test-files/sample.png')
      const result = await parseImage(imageBuffer)
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('metadata')
      expect(result).toHaveProperty('confidence')
    })
  })
  */
})

