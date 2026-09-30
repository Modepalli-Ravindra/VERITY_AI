import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & No Horizontal Overflow E2E', () => {
  test('verifies landing page layout without horizontal scrollbar', async ({ page }) => {
    await page.goto('/');
    
    // Check page width vs scrollWidth
    const hasHorizontalScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScrollbar).toBe(false);
  });
});
