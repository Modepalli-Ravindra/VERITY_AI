import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E', () => {
  test('loads successfully with title and hero elements', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('401')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Check main branding header & hero title
    await expect(page.locator('text=VERITY').first()).toBeVisible();
    await expect(page.locator('h1:has-text("See Beyond")')).toBeVisible();

    // Check CTA buttons
    await expect(page.locator('button:has-text("Analyze Your Text")')).toBeVisible();
    await expect(page.locator('button:has-text("See How It Works")')).toBeVisible();

    // Check analysis visual preview indicator
    await expect(page.getByText('INTERACTIVE PRODUCT PREVIEW')).toBeVisible();

    // Check console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('verifies landing page hero does NOT issue API requests', async ({ page }) => {
    let apiCalled = false;
    page.on('request', req => {
      if (req.url().includes('/api/analyze') || req.url().includes('/api/humanize')) {
        apiCalled = true;
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Hero visual animation should run without hitting backend APIs
    expect(apiCalled).toBe(false);
  });

  test('interactive workspace simulator functions on landing page', async ({ page }) => {
    await page.goto('/');
    
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Fill text and click simulator button
    await textarea.fill('Furthermore, it is imperative to delve into the tapestry of AI models.');
    await page.locator('button').filter({ hasText: /Simulate/ }).click();

    // Preview panel update
    await expect(page.getByText('PREVIEW ANALYSIS')).toBeVisible();
  });
});
