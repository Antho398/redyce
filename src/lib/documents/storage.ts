/**
 * Gestion du stockage des fichiers
 * Support local par défaut, extensible pour S3
 */

import { env } from '@/config/env'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface StorageResult {
  filePath: string
  fileName: string
}

export class FileStorage {
  private uploadDir: string

  constructor() {
    this.uploadDir = env.UPLOAD_DIR || './uploads'
    this.ensureUploadDir()
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Sauvegarde un fichier uploadé
   */
  async saveFile(buffer: Buffer, originalName: string): Promise<StorageResult> {
    await this.ensureUploadDir()

    const extension = path.extname(originalName)
    const fileName = `${uuidv4()}${extension}`
    const filePath = path.join(this.uploadDir, fileName)

    await fs.writeFile(filePath, buffer)

    return {
      filePath,
      fileName,
    }
  }

  /**
   * Résout un chemin (relatif ou absolu) vers un chemin complet
   */
  private resolvePath(filePath: string): string {
    // Si le chemin est déjà absolu, le retourner tel quel
    if (path.isAbsolute(filePath)) {
      return filePath
    }

    // Normaliser uploadDir (retirer ./ si présent)
    const normalizedUploadDir = this.uploadDir.replace(/^\.\//, '')

    // Si le chemin commence déjà par le dossier d'upload, le retourner tel quel
    if (filePath.startsWith(normalizedUploadDir + '/') || filePath.startsWith(this.uploadDir + '/')) {
      return filePath
    }

    // Sinon, le résoudre par rapport au répertoire d'upload
    return path.join(this.uploadDir, filePath)
  }

  /**
   * Lit un fichier stocké
   */
  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(filePath)
    return await fs.readFile(fullPath)
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(filePath)
      await fs.unlink(fullPath)
    } catch (error) {
      // Fichier déjà supprimé ou inexistant
      console.warn(`Failed to delete file ${filePath}:`, error)
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(filePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Sauvegarde un buffer à un chemin spécifique
   * Utilisé pour les templates internes générés
   */
  async saveBuffer(relativePath: string, buffer: Buffer): Promise<string> {
    await this.ensureUploadDir()
    
    const fullPath = path.join(this.uploadDir, relativePath)
    const dir = path.dirname(fullPath)
    
    // Créer le répertoire si nécessaire
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
    }
    
    await fs.writeFile(fullPath, buffer)
    return fullPath
  }
}

export const fileStorage = new FileStorage()

