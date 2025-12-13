/**
 * Utilitaire de logging pour Redyce
 * Fournit des fonctions de log formatées pour le serveur
 */

type LogLevel = 'info' | 'error' | 'warn' | 'debug'

interface LogMeta {
  [key: string]: any
}

/**
 * Formate un message de log avec timestamp et métadonnées
 */
function formatLog(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString()
  const levelUpper = level.toUpperCase().padEnd(5)
  
  let logMessage = `[${timestamp}] ${levelUpper} ${message}`
  
  if (meta && Object.keys(meta).length > 0) {
    logMessage += ` | ${JSON.stringify(meta)}`
  }
  
  return logMessage
}

/**
 * Log un message d'information
 */
export function logInfo(message: string, meta?: LogMeta): void {
  const formatted = formatLog('info', message, meta)
  console.log(formatted)
}

/**
 * Log un message d'erreur
 */
export function logError(message: string, meta?: LogMeta): void {
  const formatted = formatLog('error', message, meta)
  console.error(formatted)
  
  // Si l'erreur a une stack trace, l'afficher aussi
  if (meta?.error instanceof Error && meta.error.stack) {
    console.error(`  Stack: ${meta.error.stack}`)
  }
}

/**
 * Log un message d'avertissement
 */
export function logWarn(message: string, meta?: LogMeta): void {
  const formatted = formatLog('warn', message, meta)
  console.warn(formatted)
}

/**
 * Log un message de debug (seulement en développement)
 */
export function logDebug(message: string, meta?: LogMeta): void {
  if (process.env.NODE_ENV === 'development') {
    const formatted = formatLog('debug', message, meta)
    console.debug(formatted)
  }
}

/**
 * Helper pour logger le début d'une opération
 */
export function logOperationStart(
  operation: string,
  meta?: LogMeta
): void {
  logInfo(`[START] ${operation}`, meta)
}

/**
 * Helper pour logger la fin d'une opération avec succès
 */
export function logOperationSuccess(
  operation: string,
  meta?: LogMeta
): void {
  logInfo(`[SUCCESS] ${operation}`, meta)
}

/**
 * Helper pour logger la fin d'une opération avec erreur
 */
export function logOperationError(
  operation: string,
  error: Error | string,
  meta?: LogMeta
): void {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined
  
  logError(`[ERROR] ${operation}`, {
    ...meta,
    error: errorMessage,
    stack: errorStack,
  })
}

