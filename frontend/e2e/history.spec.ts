import { test, expect } from '@playwright/test';

test.describe('History & Analysis Features E2E', () => {
  test('history page redirects unauthenticated users or shows login prompt', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('text=Welcome back').first()).toBeVisible({ timeout: 15000 });
  });
});
