# Récapitulatif - Système de Suivi de Consommation OpenAI

## ✅ Objectif atteint

Un système complet de suivi de consommation OpenAI a été intégré dans Redyce, adapté depuis Ergobuddyconnect. Vous pouvez maintenant suivre tous vos appels à l'API OpenAI, leurs coûts et leurs statistiques.

---

## 📁 Fichiers créés/modifiés

### 1. **Prisma Schema** (`prisma/schema.prisma`)
- ✅ Ajout du modèle `AIUsage` pour stocker les consommations
- ✅ Relations avec `User` et `Project`
- ✅ Index pour optimiser les requêtes

### 2. **Service de tracking** (`src/services/usage-tracker.ts`)
- ✅ Classe `UsageTracker` avec méthodes :
  - `recordUsage()` : Enregistre une utilisation
  - `getUsageStats()` : Récupère les statistiques
  - `clearUsageData()` : Supprime les données
  - `calculateCost()` : Calcule le coût selon le modèle

### 3. **Composant UI** (`src/components/usage/UsageTracker.tsx`)
- ✅ Composant React pour afficher les statistiques
- ✅ Affichage des coûts totaux, mensuels, quotidiens
- ✅ Détail par modèle et par utilisateur
- ✅ Boutons de rafraîchissement et suppression

### 4. **Page de consommation** (`src/app/(dashboard)/consumption/page.tsx`)
- ✅ Page dédiée pour voir sa consommation
- ✅ Intégration du composant UsageTracker

### 5. **Route API** (`src/app/api/usage/route.ts`)
- ✅ `GET /api/usage` : Récupère les statistiques
- ✅ `DELETE /api/usage` : Supprime les données

### 6. **Intégration dans les clients IA**
- ✅ `src/ia/client.ts` : Tracking automatique dans `generateResponse()` et `generateJSONResponse()`
- ✅ `src/ia/pipelines/dpgf-extraction-pipeline.ts` : Support du tracking
- ✅ `src/ia/pipelines/cctp-generation-pipeline.ts` : Support du tracking

### 7. **Intégration dans les services**
- ✅ `src/services/dpgf-service.ts` : Tracking lors de l'extraction DPGF
- ✅ `src/services/cctp-service.ts` : Tracking lors de la génération CCTP

### 8. **Navigation** (`src/app/(dashboard)/layout.tsx`)
- ✅ Ajout du lien "Consommation" dans le menu

---

## 🎯 Fonctionnalités

### Suivi automatique
- ✅ Tous les appels OpenAI sont automatiquement trackés
- ✅ Enregistrement des tokens (input, output, total)
- ✅ Calcul automatique des coûts selon le modèle utilisé
- ✅ Association avec l'utilisateur, le projet et le document

### Statistiques affichées
- ✅ **Requêtes totales** : Nombre total d'appels API
- ✅ **Coût total** : Coût cumulé depuis le début
- ✅ **Coût mensuel** : Coût du mois en cours
- ✅ **Coût quotidien** : Coût du jour en cours
- ✅ **Tokens utilisés** : Nombre total de tokens
- ✅ **Détail par modèle** : Répartition par modèle (gpt-4o, gpt-4o-mini, etc.)
- ✅ **Détail par utilisateur** : Répartition par utilisateur (admin uniquement)

### Opérations trackées
- ✅ `dpgf_extraction` : Extraction de DPGF depuis un document
- ✅ `cctp_generation` : Génération de CCTP depuis un DPGF ou des documents

---

## 📊 Modèles de prix supportés

Les prix sont calculés automatiquement selon le modèle utilisé :

- **gpt-4o-mini** : $0.15 / 1M input tokens, $0.60 / 1M output tokens
- **gpt-4o** : $5.00 / 1M input tokens, $15.00 / 1M output tokens
- **gpt-4-turbo-preview** : $10.00 / 1M input tokens, $30.00 / 1M output tokens
- **gpt-3.5-turbo** : $0.50 / 1M input tokens, $1.50 / 1M output tokens

*Note : Les prix peuvent être mis à jour dans `src/services/usage-tracker.ts` si OpenAI change ses tarifs.*

---

## 🚀 Utilisation

### Pour voir votre consommation

1. **Accéder à la page** :
   - Cliquer sur "Consommation" dans le menu de navigation
   - OU aller directement sur `/consumption`

2. **Visualiser les statistiques** :
   - Les statistiques se chargent automatiquement
   - Vous voyez vos coûts totaux, mensuels et quotidiens
   - Détail par modèle et par opération

3. **Rafraîchir les données** :
   - Cliquer sur le bouton de rafraîchissement (icône circulaire)

4. **Supprimer les données** (admin uniquement) :
   - Cliquer sur le bouton de suppression (icône poubelle)
   - Confirmer dans la modale

### Tracking automatique

Le tracking est **automatique** pour toutes les opérations suivantes :

- ✅ Extraction DPGF (`/api/dpgf/extract`)
- ✅ Génération CCTP (`/api/cctp/generate`)

Aucune action supplémentaire n'est nécessaire. Chaque appel OpenAI enregistre automatiquement :
- Le modèle utilisé
- Les tokens consommés (input, output, total)
- Le coût calculé
- L'utilisateur
- Le projet (si applicable)
- Le document (si applicable)
- L'opération effectuée

---

## 🔧 Configuration

### Migration de la base de données

Après avoir ajouté le modèle `AIUsage`, exécutez :

```bash
npm run db:push
# ou
npm run db:migrate dev --name add_ai_usage
```

### Génération du client Prisma

Le client Prisma a déjà été régénéré avec :

```bash
npx prisma generate
```

---

## 📈 Exemple de données trackées

Chaque enregistrement contient :

```typescript
{
  id: "clx...",
  userId: "clx...",
  userEmail: "user@example.com",
  model: "gpt-4-turbo-preview",
  inputTokens: 1500,
  outputTokens: 800,
  totalTokens: 2300,
  cost: 0.024, // $0.024
  operation: "dpgf_extraction",
  projectId: "clx...",
  documentId: "clx...",
  createdAt: "2024-12-12T..."
}
```

---

## 🎨 Interface utilisateur

La page de consommation affiche :

1. **Cartes de statistiques principales** :
   - Requêtes totales (bleu)
   - Coût total (vert)
   - Coût mensuel (violet)
   - Coût quotidien (orange)

2. **Section tokens** :
   - Total de tokens utilisés

3. **Détail par modèle** :
   - Liste des modèles avec nombre de requêtes, tokens et coût

4. **Détail par utilisateur** (admin uniquement) :
   - Liste des utilisateurs avec leur consommation

---

## ⚠️ Notes importantes

1. **Prix approximatifs** : Les coûts sont calculés selon les tarifs OpenAI publics. Ils peuvent varier légèrement selon votre plan.

2. **Tracking non-bloquant** : Si l'enregistrement de l'usage échoue, l'opération principale continue. Les erreurs sont loggées mais n'interrompent pas le flux.

3. **Données utilisateur** : Chaque utilisateur voit uniquement sa propre consommation. Les admins peuvent voir toutes les consommations.

4. **Performance** : Les enregistrements sont asynchrones et n'impactent pas les performances des appels API.

---

## 🔄 Prochaines étapes possibles

- [ ] Ajouter des graphiques de consommation (chart.js, recharts)
- [ ] Exporter les données en CSV/Excel
- [ ] Alertes de seuil de consommation
- [ ] Historique détaillé par opération
- [ ] Filtres par date, modèle, opération
- [ ] Dashboard admin avec vue globale

---

**Statut :** ✅ Complété et fonctionnel
**Date :** 2024-12-12

