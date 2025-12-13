import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la gestion des projets
 */

test.describe('Projects Management', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Créer un utilisateur de test pour chaque test
    testEmail = `test-${Date.now()}@redyce.fr`;
    testPassword = 'testpassword123';

    // Créer le compte
    await page.request.post('http://localhost:3000/api/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });

    // Se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Se connecter")');
    await page.waitForURL('/projects');
  });

  test('should display projects page', async ({ page }) => {
    // Vérifier que la page des projets s'affiche
    await expect(page.locator('h1:has-text("Mes Projets")')).toBeVisible();
    
    // Vérifier le bouton "Nouveau Projet"
    await expect(page.locator('a:has-text("Nouveau Projet")')).toBeVisible();
  });

  test('should create a new project via API', async ({ page }) => {
    // Aller sur la page des projets
    await page.goto('/projects');

    // Créer un projet via l'API
    const projectResponse = await page.request.post('http://localhost:3000/api/projects', {
      data: {
        name: 'Projet Test E2E',
        description: 'Description du projet de test',
      },
    });

    expect(projectResponse.ok()).toBeTruthy();
    const projectData = await projectResponse.json();
    expect(projectData.success).toBeTruthy();
    expect(projectData.data).toHaveProperty('id');
    expect(projectData.data.name).toBe('Projet Test E2E');
  });
});

