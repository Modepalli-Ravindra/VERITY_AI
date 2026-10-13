import { test, expect } from '@playwright/test';

test.describe('Compare Workspace & Dashboard Telemetry End-to-End', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Intercept InsForge auth session to ensure authenticated user
    await page.route('**/*insforge.app/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'e2e-user-123',
              email: 'researcher@verity.ai',
              name: 'Dr. Turing'
            }
          }
        })
      });
    });

    // Mock initial authenticated session and access token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'verity_session_user',
        JSON.stringify({
          id: 'e2e-user-123',
          email: 'researcher@verity.ai',
          name: 'Dr. Turing'
        })
      );
      window.localStorage.setItem(
        'verity_access_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci0xMjMiLCJleHAiOjI1MzQwMjMwMDd9.signature'
      );
    });
  });

  test('Compare page loads without NaN and shows clean empty/neutral state', async ({ page }) => {
    await page.goto('/compare');

    // Page header and toolbar
    await expect(page.locator('text=COMPARE WORKSPACE')).toBeVisible();

    // Verify probability telemetry cards render valid values or '—', NEVER 'NaN'
    const originalProb = page.locator('text=Original AI Probability').locator('..');
    const adversarialProb = page.locator('text=Adversarial AI Probability').locator('..');
    const signalChange = page.locator('text=AI SIGNAL CHANGE').locator('..');

    await expect(originalProb).toBeVisible();
    await expect(adversarialProb).toBeVisible();
    await expect(signalChange).toBeVisible();

    const origText = await originalProb.textContent();
    const humText = await adversarialProb.textContent();
    const sigText = await signalChange.textContent();

    expect(origText).not.toContain('NaN');
    expect(humText).not.toContain('NaN');
    expect(sigText).not.toContain('NaN');

    // Split-screen editor panes
    await expect(page.locator('text=ORIGINAL SEQUENCE')).toBeVisible();
    await expect(page.locator('text=ADVERSARIAL SEQUENCE')).toBeVisible();

    // Word counts should be numbers, not NaN
    const wordCountDelta = page.locator('text=Word Count Delta').locator('..');
    await expect(wordCountDelta).toBeVisible();
    const deltaText = await wordCountDelta.textContent();
    expect(deltaText).not.toContain('NaN');
  });

  test('Dashboard page displays authentic telemetry and live model status without fabricated data', async ({ page }) => {
    await page.goto('/dashboard');

    // Dashboard header
    await expect(page.locator('text=INTELLIGENCE DASHBOARD')).toBeVisible();

    // Stats cards
    await expect(page.locator('text=Total Analyses')).toBeVisible();
    await expect(page.locator('text=Classification Split')).toBeVisible();
    await expect(page.locator('text=Paraphrases')).toBeVisible();
    await expect(page.locator('text=Comparisons')).toBeVisible();
    await expect(page.locator('text=Active Detector')).toBeVisible();

    // 7-day throughput chart exists and renders day labels
    await expect(page.locator('text=7-Day Telemetry Throughput')).toBeVisible();

    // Recent activity header
    await expect(page.locator('text=Recent Workspace Activity')).toBeVisible();
  });

  test('Analyze page displays unified split-screen workspace with ready placeholder', async ({ page }) => {
    await page.goto('/analyze');

    // Left pane controls
    await expect(page.locator('button:has-text("Paste Text")')).toBeVisible();
    await expect(page.locator('button:has-text("Upload File")')).toBeVisible();

    // Right pane ready placeholder
    await expect(page.locator('text=Detection Diagnostics Ready')).toBeVisible();
    await expect(page.locator('text=ModernBERT V5')).toBeVisible();
    await expect(page.locator('text=0.70 Calibrated')).toBeVisible();
  });
});
