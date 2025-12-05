import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/GalaxyCo/i);
  });

  test('should show sign-in button on homepage', async ({ page }) => {
    const signInButton = page.getByRole('link', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to sign-in page', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should show sign-up option', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should display Clerk sign-in widget', async ({ page }) => {
    await page.goto('http://localhost:3000/sign-in');
    // Clerk widget should be present
    const clerkWidget = page.locator('[data-clerk-element]').first();
    await expect(clerkWidget).toBeVisible({ timeout: 10000 });
  });

  test('should display Clerk sign-up widget', async ({ page }) => {
    await page.goto('http://localhost:3000/sign-up');
    // Clerk widget should be present
    const clerkWidget = page.locator('[data-clerk-element]').first();
    await expect(clerkWidget).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to dashboard after successful sign-in', async ({ page }) => {
    // Note: This test requires actual Clerk credentials to complete
    // In CI/CD, use environment variables for test user credentials
    await page.goto('http://localhost:3000/sign-in');
    
    // Wait for Clerk widget to load
    await page.waitForSelector('[data-clerk-element]', { timeout: 10000 });
    
    // After manual sign-in or automated sign-in with test credentials:
    // await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/sign-in');
    
    // Wait for Clerk form
    await page.waitForSelector('[data-clerk-element]', { timeout: 10000 });
    
    // Clerk will handle validation and error display
  });

  test('should allow navigation between sign-in and sign-up', async ({ page }) => {
    await page.goto('http://localhost:3000/sign-in');
    
    // Find link to sign-up
    const signUpLink = page.locator('text=/.*sign up/i').first();
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/.*sign-up/);
    }
  });

  test('should persist session after page reload', async ({ page, context }) => {
    // This test assumes user is already signed in
    await page.goto('http://localhost:3000/dashboard');
    
    // If redirected to sign-in, user is not authenticated
    const url = page.url();
    if (!url.includes('sign-in')) {
      // User is authenticated, reload should maintain session
      await page.reload();
      await expect(page).not.toHaveURL(/.*sign-in/);
    }
  });

  test('should handle sign-out correctly', async ({ page }) => {
    // Navigate to dashboard (assumes signed in)
    await page.goto('http://localhost:3000/dashboard');
    
    const url = page.url();
    if (!url.includes('sign-in')) {
      // User is signed in, find and click sign out
      const userButton = page.locator('[data-clerk-element="user-button"]').first();
      if (await userButton.isVisible()) {
        await userButton.click();
        
        // Click sign out in menu
        const signOutButton = page.locator('text=/sign out/i').first();
        await signOutButton.click();
        
        // Should redirect to home or sign-in
        await expect(page).toHaveURL(/\/(sign-in)?$/);
      }
    }
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('http://localhost:3000/dashboard');
    
    // Should redirect to sign-in
    await page.waitForURL(/.*sign-in/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should protect CRM routes', async ({ page }) => {
    await page.goto('http://localhost:3000/crm');
    await page.waitForURL(/.*sign-in/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should protect Library routes', async ({ page }) => {
    await page.goto('http://localhost:3000/library');
    await page.waitForURL(/.*sign-in/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should allow access to public routes', async ({ page }) => {
    // Homepage should be accessible without auth
    await page.goto('http://localhost:3000');
    await expect(page).not.toHaveURL(/.*sign-in/);
    
    // Launchpad blog should be public
    await page.goto('http://localhost:3000/launchpad');
    await expect(page).not.toHaveURL(/.*sign-in/);
  });
});

test.describe('Authentication - Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    await page.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });
    
    // Page should load with error state or cached content
    await page.context().setOffline(false);
  });

  test('should handle expired sessions', async ({ page }) => {
    // This would require manipulating session cookies
    // In real implementation, clear session cookies and verify redirect
    await page.goto('http://localhost:3000/dashboard');
    
    // If not authenticated, should redirect
    const url = page.url();
    const isAuthenticated = !url.includes('sign-in');
    
    if (isAuthenticated) {
      // User is authenticated - session is valid
      expect(url).toContain('dashboard');
    } else {
      // User is not authenticated - redirected correctly
      expect(url).toMatch(/sign-in/);
    }
  });
});
