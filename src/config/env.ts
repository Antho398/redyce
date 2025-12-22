/**
 * Configuration des variables d'environnement
 * Valide et exporte les variables nécessaires à l'application
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Storage
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // App Config
  MAX_FILE_SIZE: z.string().default('52428800'), // 50MB
  UPLOAD_DIR: z.string().default('./uploads'),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `❌ Invalid environment variables:\n${error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`
      )
    }
    throw error
  }
}

// Pour le worker standalone, on doit recharger env après que dotenv ait été chargé
// On utilise une fonction getter pour que env soit réévalué si nécessaire
let _env: Env | null = null

function getEnvCached(): Env {
  if (!_env) {
    _env = getEnv()
  }
  return _env
}

// Permettre de réinitialiser env (utile pour le worker)
export function reloadEnv() {
  _env = null
  return getEnvCached()
}

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    return getEnvCached()[prop as keyof Env]
  },
})

