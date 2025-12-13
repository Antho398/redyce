import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'authentification
 */

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Vérifier que la page de connexion s'affiche
    await expect(page).toHaveTitle(/Redyce/);
    await expect(page.locator('h3:has-text("Connexion")')).toBeVisible();
    
    // Vérifier les champs du formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Se connecter")')).toBeVisible();
    
    // Vérifier le lien vers l'inscription
    await expect(page.locator('a:has-text("Créer un compte")')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    // Vérifier que la page d'inscription s'affiche
    await expect(page.locator('h3:has-text("Créer un compte")')).toBeVisible();
    
    // Vérifier les champs du formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Créer mon compte")')).toBeVisible();
    
    // Vérifier le lien vers la connexion
    await expect(page.locator('a:has-text("Se connecter")')).toBeVisible();
  });

  test('should redirect to /projects after successful login', async ({ page }) => {
    // Créer un utilisateur de test d'abord (via l'API)
    const testEmail = `test-${Date.now()}@redyce.fr`;
    const testPassword = 'testpassword123';

    // Créer le compte via l'API
    const registerResponse = await page.request.post('http://localhost:3000/api/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Aller sur la page de connexion
    await page.goto('/login');

    // Remplir le formulaire
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Soumettre le formulaire
    await page.click('button:has-text("Se connecter")');

    // Vérifier la redirection vers /projects
    await page.waitForURL('/projects', { timeout: 5000 });
    
    // Vérifier que la page des projets s'affiche
    await expect(page.locator('h1:has-text("Mes Projets")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Essayer de se connecter avec des identifiants invalides
    await page.fill('input[type="email"]', 'invalid@redyce.fr');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Se connecter")');

    // Vérifier que l'erreur s'affiche
    await expect(page.locator('text=Email ou mot de passe incorrect')).toBeVisible({ timeout: 5000 });

    // Vérifier qu'on reste sur la page de connexion
    await expect(page).toHaveURL(/\/login/);
  });
});

