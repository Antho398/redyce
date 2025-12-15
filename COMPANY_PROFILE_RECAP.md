# Récapitulatif - Profil Entreprise Global (ADN entreprise)

## ✅ Fichiers créés/modifiés

### 1. **Migration Prisma** (nouveau)
- `prisma/migrations/20241216000002_add_company_profile/migration.sql`
- Table `company_profiles` avec relation 1-1 vers `User`

### 2. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Modèle `CompanyProfile` ajouté :
  - `id`, `userId` (unique)
  - `companyName` (obligatoire)
  - `description`, `activities`, `workforce`, `equipment`, `qualitySafety`, `references` (optionnels)
- ✅ Relation `companyProfile` ajoutée au modèle `User` (1-1)

### 3. **Service** (`src/services/company-profile-service.ts`) - NOUVEAU
- ✅ `getProfile` : Récupère le profil d'un utilisateur
- ✅ `upsertProfile` : Crée ou met à jour le profil (upsert)

### 4. **Route API** (`src/app/api/company-profile/route.ts`) - NOUVELLE
- ✅ `GET /api/company-profile` : Récupère le profil du user connecté
- ✅ `POST /api/company-profile` : Crée ou met à jour le profil
- ✅ Sécurité : Authentification requise, user ne peut accéder qu'à son profil
- ✅ Validation Zod

### 5. **Page UI** (`src/app/(dashboard)/settings/company-profile/page.tsx`) - NOUVELLE
- ✅ Formulaire structuré avec tous les champs
- ✅ Message explicite : "Ces informations seront utilisées pour générer vos mémoires techniques"
- ✅ Info card : "Profil global transversal à tous les projets"
- ✅ Bouton "Enregistrer" avec état loading

### 6. **Composant Warning** (`src/components/memoire/CompanyProfileWarning.tsx`) - NOUVEAU
- ✅ Avertissement non bloquant si profil vide
- ✅ CTA vers `/settings/company-profile`

### 7. **Intégration IA** (`src/services/section-ai-service.ts`)
- ✅ Récupération du profil entreprise dans `buildContext`
- ✅ Injection du profil dans le prompt IA
- ✅ Instructions strictes : ne jamais inventer au-delà du profil
- ✅ Warning si profil vide dans le prompt

### 8. **UI Éditeur** (`src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx`)
- ✅ Affichage du warning `CompanyProfileWarning` en haut de l'éditeur

## Fonctionnalités implémentées

### Profil entreprise

**Champs** :
- `companyName` (obligatoire)
- `description` : Présentation générale
- `activities` : Corps d'état / spécialités
- `workforce` : Effectifs
- `equipment` : Moyens matériels
- `qualitySafety` : Qualité / sécurité / environnement
- `references` : Références chantiers

**Caractéristiques** :
- ✅ 1-1 avec User (profil global, pas par projet)
- ✅ Upsert (création ou mise à jour)
- ✅ Pas obligatoire pour créer un mémoire
- ✅ Réutilisé automatiquement dans tous les projets/mémoires

### Intégration dans l'IA

**Contexte injecté** :
- Si profil existe : toutes les informations du profil sont ajoutées au prompt
- Si profil vide : warning "Informations entreprise manquantes" dans le prompt

**Instructions IA** :
- Utiliser UNIQUEMENT les informations du profil fourni
- Ne JAMAIS inventer d'informations sur l'entreprise
- Si profil vide : indiquer "Informations entreprise manquantes"

### UX

- ✅ Warning non bloquant dans l'éditeur si profil vide
- ✅ CTA vers la page de paramètres
- ✅ Message clair : "Les réponses seront génériques"
- ✅ Info card dans la page paramètres : "Profil global transversal"

## Migration

### Commande à exécuter

```bash
# Appliquer la migration
npx prisma migrate deploy

# OU directement avec SQL
psql -d redyce -f prisma/migrations/20241216000002_add_company_profile/migration.sql

# Générer le client Prisma
npx prisma generate
```

### Contenu de la migration

La migration crée :
- Table `company_profiles` avec tous les champs
- Unique index sur `userId` (1-1)
- Index sur `userId` pour performance
- Foreign key vers `users` avec CASCADE

## Endpoints disponibles

### GET /api/company-profile
**Description** : Récupère le profil entreprise de l'utilisateur connecté

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "companyName": "Mon Entreprise",
    "description": "...",
    // ... autres champs
  }
}
```
ou `data: null` si le profil n'existe pas

### POST /api/company-profile
**Description** : Crée ou met à jour le profil entreprise (upsert)

**Body** :
```json
{
  "companyName": "Mon Entreprise", // Obligatoire
  "description": "...",
  "activities": "...",
  "workforce": "...",
  "equipment": "...",
  "qualitySafety": "...",
  "references": "..."
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "companyName": "...",
    // ... profil créé/mis à jour
  }
}
```

## Comment vérifier que le profil est pris en compte dans l'IA

### Test 1 : Sans profil
1. S'assurer qu'aucun profil entreprise n'existe
2. Aller sur l'éditeur d'un mémoire
3. Vérifier que le warning "Profil entreprise non complété" s'affiche
4. Utiliser une action IA (ex: "Compléter")
5. Vérifier dans la réponse que l'IA mentionne "Informations entreprise manquantes" ou répond de façon générique

### Test 2 : Avec profil
1. Aller sur `/settings/company-profile`
2. Compléter au moins le nom de l'entreprise et quelques champs
3. Sauvegarder
4. Retourner sur l'éditeur d'un mémoire
5. Vérifier que le warning a disparu
6. Utiliser une action IA (ex: "Compléter")
7. Vérifier dans la réponse que l'IA utilise les informations du profil (nom entreprise, activités, etc.)

### Test 3 : Vérification dans les logs (optionnel)
1. Vérifier dans les logs serveur que le prompt IA contient bien la section "Profil entreprise"
2. Vérifier que les instructions incluent "Utiliser UNIQUEMENT les informations du profil fourni"

## Checklist de test manuel

### Test 1 : Créer/mettre à jour le profil
- [ ] Aller sur `/settings/company-profile`
- [ ] Remplir le formulaire (au moins le nom)
- [ ] Cliquer "Enregistrer"
- [ ] Vérifier le toast de succès
- [ ] Recharger la page → vérifier que les données sont conservées

### Test 2 : Warning dans l'éditeur
- [ ] S'assurer qu'aucun profil n'existe (ou supprimer)
- [ ] Aller sur l'éditeur d'un mémoire
- [ ] Vérifier que le warning s'affiche en haut
- [ ] Cliquer sur "Compléter le profil entreprise"
- [ ] Vérifier la redirection vers `/settings/company-profile`

### Test 3 : Intégration IA sans profil
- [ ] Utiliser une action IA dans l'éditeur sans profil
- [ ] Vérifier que la réponse est générique
- [ ] Vérifier que l'IA ne mentionne pas d'informations spécifiques sur l'entreprise

### Test 4 : Intégration IA avec profil
- [ ] Compléter le profil entreprise
- [ ] Utiliser une action IA dans l'éditeur
- [ ] Vérifier que la réponse utilise les informations du profil
- [ ] Vérifier que l'IA ne mentionne que des informations présentes dans le profil

## Points d'attention

- ⚠️ **Profil non obligatoire** : Ne bloque pas la création de mémoires
- ✅ **Profil global** : Un seul profil par utilisateur, transversal à tous les projets
- ✅ **Sécurité** : User ne peut accéder qu'à son propre profil
- ✅ **IA stricte** : L'IA ne doit JAMAIS inventer d'informations au-delà du profil
- ✅ **Warning non bloquant** : Avertissement dans l'UI mais pas de blocage fonctionnel

## Structure de données

### CompanyProfile (Prisma)
```prisma
model CompanyProfile {
  id            String   @id
  userId        String   @unique
  companyName   String
  description   String?  @db.Text
  activities    String?  @db.Text
  workforce     String?  @db.Text
  equipment     String?  @db.Text
  qualitySafety String?  @db.Text
  references    String?  @db.Text
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ...
}
```

## Améliorations futures

- [ ] Upload logo entreprise
- [ ] Champs structurés (activités en array, effectifs par métier, etc.)
- [ ] Historique des modifications
- [ ] Prévisualisation du contexte envoyé à l'IA
- [ ] Export du profil (PDF/DOCX)

