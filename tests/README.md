# Tests E2E - Redyce

Ce dossier contient les tests end-to-end automatisés pour Redyce.

## 🚀 Quick Start

```bash
# Exécuter tous les tests
npm run test:e2e

# Exécuter avec l'interface UI (recommandé pour le développement)
npm run test:e2e:ui

# Exécuter en mode headed (voir le navigateur)
npm run test:e2e:headed
```

## 📁 Structure

```
tests/
└── e2e/
    ├── auth.spec.ts      # Tests d'authentification (login, register)
    └── projects.spec.ts  # Tests de gestion des projets
```

## ✅ Tests disponibles

### auth.spec.ts

- ✅ Affichage de la page de connexion
- ✅ Affichage de la page d'inscription  
- ✅ Redirection vers `/projects` après connexion réussie
- ✅ Affichage d'erreur avec identifiants invalides

### projects.spec.ts

- ✅ Affichage de la page des projets
- ✅ Création d'un projet via l'API

## 🔧 Configuration

Les tests sont configurés dans `playwright.config.ts` à la racine du projet.

Par défaut :
- Base URL : `http://localhost:3000`
- Le serveur de développement est lancé automatiquement avant les tests
- Navigateur : Chromium

## 📝 Ajouter un nouveau test

Créer un nouveau fichier dans `tests/e2e/` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mon nouveau test', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/ma-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🔍 Debugging

Pour déboguer un test :

```bash
# Lancer en mode UI (interactif)
npm run test:e2e:ui

# Lancer un test spécifique
npx playwright test tests/e2e/auth.spec.ts

# Lancer avec le debugger
PWDEBUG=1 npm run test:e2e
```

## 📚 Documentation

Pour le scénario de test complet (manuel et automatisé), voir [TESTS_E2E.md](../TESTS_E2E.md) à la racine du projet.

