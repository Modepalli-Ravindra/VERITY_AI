import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Routes E2E', () => {
  test('redirects unauthenticated users to login for protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Welcome back').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible();
  });

  test('validates registration input on sign up page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create your account').first()).toBeVisible({ timeout: 15000 });

    await page.fill('input[id="displayName"]', 'Test User');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', '123');
    await page.fill('input[id="confirmPassword"]', '123');

    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible({ timeout: 10000 });

    // Test password mismatch
    await page.fill('input[id="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'Different123!');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 10000 });

    // Test password complexity (missing special character)
    await page.fill('input[id="password"]', 'Password123');
    await page.fill('input[id="confirmPassword"]', 'Password123');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Password must contain uppercase, lowercase, number, and special character')).toBeVisible({ timeout: 10000 });
  });
});
