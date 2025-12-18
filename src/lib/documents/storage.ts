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
   * Lit un fichier stocké
   */
  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath)
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
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
      await fs.access(filePath)
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

