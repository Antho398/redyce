# Analyse - Extraction des Exigences lors de l'Upload

## 📍 1. Fichier exact et fonction déclencheur

### Fichier : `src/app/api/documents/upload/route.ts`

**Fonction** : `POST` (ligne 16)
**Lignes clés** : 157-172

```157:172:src/app/api/documents/upload/route.ts
    // Enqueue l'extraction automatique des exigences pour TOUS les documents
    // Le job sera traité en arrière-plan (ne bloque pas la réponse)
    // 1. Enqueue le document pour extraction
    requirementExtractionJob.enqueueDocument(document.id).catch((error) => {
      console.error('[Document Upload] Error enqueueing document:', error)
    })

    // 2. Lancer l'extraction en arrière-plan (async, non-blocking)
    // Note: Dans un environnement de production, ceci serait un vrai job queue (Bull, etc.)
    setImmediate(async () => {
      try {
        await requirementExtractionJob.extractForDocument(document.id, userId)
      } catch (error) {
        console.error('[Document Upload] Error in requirement extraction job:', error)
      }
    })
```

### Service : `src/services/requirement-extraction-job.ts`

- **`enqueueDocument(documentId)`** (ligne 241) : Met le statut `requirementStatus` à `WAITING`
- **`extractForDocument(documentId, userId)`** (ligne 59) : Traite l'extraction complète

---

## ⚙️ 2. Type de traitement : **ASYNCHRONE** (mais simplifié)

### Mécanisme actuel

✅ **Asynchrone** : Utilise `setImmediate()` pour ne pas bloquer la réponse HTTP  
❌ **Pas de queue persistée** : Le job n'est pas stocké en DB  
❌ **Pas de worker dédié** : Le traitement se fait dans le même processus Node.js  

### Flux actuel

1. **Upload** → Document créé en DB avec `requirementStatus = null`
2. **Enqueue** → `requirementStatus = 'WAITING'` (ligne 259)
3. **setImmediate** → Appel asynchrone à `extractForDocument()`
4. **Extraction** → Traitement immédiat :
   - Parse le document
   - Appel IA
   - Insertion des exigences
   - Mise à jour `requirementStatus = 'DONE'` ou `'ERROR'`

---

## 🔧 3. Mécanisme actuel détaillé

### Pas de table de jobs
- ❌ Pas de table `Job` ou `JobQueue` dans Prisma
- ✅ Le statut est stocké dans `Document.requirementStatus` (enum `DocumentProcessingStatus`)
- ✅ Les champs `requirementProcessedAt` et `requirementErrorMessage` stockent le résultat

### Schéma actuel (Document model)

```prisma
model Document {
  requirementStatus    DocumentProcessingStatus? // WAITING, PROCESSING, DONE, ERROR
  requirementProcessedAt DateTime?
  requirementErrorMessage String?
}
```

### Problèmes actuels

1. **Pas de retry automatique** : Si le traitement échoue, pas de mécanisme de retry
2. **Pas de priorisation** : Impossible de prioriser certains documents
3. **Pas de visibilité** : Pas d'historique des tentatives
4. **Risque de perte** : Si le serveur crash, les jobs en attente sont perdus
5. **Pas de rate limiting** : Tous les jobs s'exécutent en parallèle

---

## 🎯 4. Proposition de refactor minimal

### Architecture proposée

**Table Job + Worker simple**

### A. Schéma Prisma à ajouter

```prisma
enum JobType {
  EXTRACT_REQUIREMENTS
}

enum JobStatus {
  PENDING      // En attente
  PROCESSING   // En cours de traitement
  COMPLETED    // Terminé avec succès
  FAILED       // Échec (peut être retry)
  CANCELLED    // Annulé
}

model Job {
  id            String   @id @default(cuid())
  type          JobType
  status        JobStatus @default(PENDING)
  payload       Json     // { documentId, userId, projectId, ... }
  result        Json?    // Résultat du traitement (optionnel)
  error         String?  // Message d'erreur si échec
  attempts      Int      @default(0)
  maxAttempts   Int      @default(3)
  priority      Int      @default(0) // Plus élevé = prioritaire
  scheduledAt   DateTime @default(now()) // Quand le job doit être traité
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([type, status, scheduledAt])
  @@index([status])
  @@map("jobs")
}
```

### B. Modifications à apporter

#### 1. **Migration Prisma**

Créer une migration pour la table `Job` :

```bash
npx prisma migrate dev --name add_job_queue_table
```

#### 2. **Service JobQueue** (nouveau fichier)

`src/services/job-queue.ts`

```typescript
import { prisma } from '@/lib/prisma/client'

export interface JobPayload {
  documentId: string
  userId: string
  projectId: string
}

export class JobQueue {
  async enqueue(type: 'EXTRACT_REQUIREMENTS', payload: JobPayload, priority = 0) {
    return prisma.job.create({
      data: {
        type,
        status: 'PENDING',
        payload,
        priority,
      },
    })
  }

  async getNextJob(type: 'EXTRACT_REQUIREMENTS') {
    return prisma.job.findFirst({
      where: {
        type,
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    })
  }

  async markProcessing(jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    })
  }

  async markCompleted(jobId: string, result?: any) {
    return prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result,
      },
    })
  }

  async markFailed(jobId: string, error: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    
    if (job && job.attempts < job.maxAttempts) {
      // Retry : remettre en PENDING avec délai exponentiel
      const delay = Math.pow(2, job.attempts) * 60 * 1000 // 1min, 2min, 4min
      return prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'PENDING',
          scheduledAt: new Date(Date.now() + delay),
          error,
        },
      })
    } else {
      // Max attempts atteint
      return prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error,
        },
      })
    }
  }
}

export const jobQueue = new JobQueue()
```

#### 3. **Modifier `requirement-extraction-job.ts`**

Ajouter une méthode qui utilise le JobQueue :

```typescript
async enqueueDocument(documentId: string, userId: string): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true, requirementStatus: true },
  })

  if (!document) {
    throw new Error(`Document ${documentId} not found`)
  }

  // Ne pas re-enqueue si déjà traité avec succès
  if (document.requirementStatus === 'DONE') {
    return
  }

  // Créer un job dans la queue
  await jobQueue.enqueue('EXTRACT_REQUIREMENTS', {
    documentId,
    userId,
    projectId: document.projectId,
  })

  // Mettre à jour le statut du document
  await prisma.document.update({
    where: { id: documentId },
    data: {
      requirementStatus: 'WAITING',
    },
  })
}
```

#### 4. **Worker simple** (nouveau fichier)

`src/workers/requirement-extraction-worker.ts`

```typescript
import { jobQueue, JobPayload } from '@/services/job-queue'
import { requirementExtractionJob } from '@/services/requirement-extraction-job'

export class RequirementExtractionWorker {
  private running = false
  private intervalId: NodeJS.Timeout | null = null

  start(intervalMs = 5000) {
    if (this.running) return
    
    this.running = true
    this.processJobs()
    this.intervalId = setInterval(() => this.processJobs(), intervalMs)
  }

  stop() {
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async processJobs() {
    if (!this.running) return

    const job = await jobQueue.getNextJob('EXTRACT_REQUIREMENTS')
    if (!job) return

    try {
      // Marquer comme PROCESSING
      await jobQueue.markProcessing(job.id)

      const payload = job.payload as JobPayload

      // Traiter le job
      const result = await requirementExtractionJob.extractForDocument(
        payload.documentId,
        payload.userId
      )

      // Marquer comme COMPLETED
      await jobQueue.markCompleted(job.id, result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await jobQueue.markFailed(job.id, errorMessage)
    }
  }
}

export const requirementExtractionWorker = new RequirementExtractionWorker()
```

#### 5. **Modifier `upload/route.ts`**

Remplacer le `setImmediate` par l'enqueue via JobQueue :

```typescript
// AVANT (lignes 157-172)
requirementExtractionJob.enqueueDocument(document.id).catch(...)
setImmediate(async () => {
  await requirementExtractionJob.extractForDocument(document.id, userId)
})

// APRÈS
await requirementExtractionJob.enqueueDocument(document.id, userId)
// Le worker traitera le job automatiquement
```

#### 6. **Initialiser le worker**

Dans `src/app/api/documents/upload/route.ts` ou mieux, dans un fichier dédié :

```typescript
// src/lib/workers/init.ts
import { requirementExtractionWorker } from '@/workers/requirement-extraction-worker'

// Démarrer le worker au démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  requirementExtractionWorker.start(5000) // Poll toutes les 5 secondes
}
```

Ou dans `src/app/api/workers/start/route.ts` (route API pour démarrer/arrêter) :

```typescript
import { requirementExtractionWorker } from '@/workers/requirement-extraction-worker'

export async function POST() {
  requirementExtractionWorker.start()
  return NextResponse.json({ success: true })
}
```

---

## 📊 Résumé des fichiers à modifier

### Nouveaux fichiers
1. `prisma/schema.prisma` → Ajouter modèles `Job`, `JobType`, `JobStatus`
2. `src/services/job-queue.ts` → Service de gestion des jobs
3. `src/workers/requirement-extraction-worker.ts` → Worker qui traite les jobs

### Fichiers à modifier
1. `src/app/api/documents/upload/route.ts` (lignes 157-172) → Utiliser `enqueueDocument` avec userId
2. `src/services/requirement-extraction-job.ts` → Modifier `enqueueDocument` pour utiliser JobQueue

### Fichiers optionnels
1. `src/lib/workers/init.ts` → Initialiser le worker au démarrage
2. `src/app/api/workers/start/route.ts` → Route API pour démarrer le worker manuellement

---

## ✅ Avantages du refactor

1. **Persistance** : Les jobs sont stockés en DB, pas de perte en cas de crash
2. **Retry automatique** : Gestion des échecs avec retry exponentiel
3. **Visibilité** : Historique complet des jobs dans la DB
4. **Scalabilité** : Facile d'ajouter plusieurs workers plus tard
5. **Priorisation** : Support des priorités
6. **Monitoring** : Facile d'ajouter un dashboard pour voir les jobs

---

## 🔄 Migration progressive

1. Créer la table `Job` en DB
2. Modifier `enqueueDocument` pour créer un job
3. Lancer le worker en parallèle avec `setImmediate` (double écriture)
4. Une fois stable, supprimer `setImmediate`
5. Optionnel : Ajouter un dashboard pour monitorer les jobs

