import { test, expect } from '@playwright/test';

test.describe('Humanizer 2.0 Tests', () => {
  const backendBase = 'http://127.0.0.1:8000';
  const testAuthHeaders = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.signature'
  };

  const sampleRoboticText =
    'Furthermore, it is imperative to delve into the tapestry of AI models in order to analyze their capabilities. Consequently, organizations optimize their operational efficiency seamlessly.';

  // 1. Each tone: Natural, Professional, Academic, Casual
  for (const targetTone of ['natural', 'professional', 'academic', 'casual']) {
    test(`API transforms text with ${targetTone} tone`, async ({ request }) => {
      const response = await request.post(`${backendBase}/api/humanize`, {
        headers: testAuthHeaders,
        data: {
          text: sampleRoboticText,
          tone: targetTone
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.humanized_text).toBeTruthy();
      expect(data.tone).toBe(targetTone);
      expect(typeof data.humanized_text).toBe('string');
      expect(data.humanized_text.length).toBeGreaterThan(20);
    });
  }

  // 2. Empty input validation
  test('API rejects empty text input', async ({ request }) => {
    const response = await request.post(`${backendBase}/api/humanize`, {
      headers: testAuthHeaders,
      data: {
        text: '   ',
        tone: 'natural'
      }
    });

    expect(response.status()).toBe(400);
    const err = await response.json();
    expect(err.detail.toLowerCase()).toContain('empty');
  });

  // 3. Provider failure handling
  test('API handles provider failure gracefully', async ({ request }) => {
    const response = await request.post(`${backendBase}/api/humanize`, {
      headers: testAuthHeaders,
      data: {
        text: sampleRoboticText,
        provider: 'none'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.error || data.humanized_text).toBeTruthy();
  });

  // 4. Long text handling
  test('API successfully processes multi-paragraph long text', async ({ request }) => {
    const longText = [
      'Section 1: Furthermore, transformer architectures optimize natural language representations across arbitrary sequence positions.',
      'Section 2: Moreover, researchers delve into stylometric variances including type-token ratio and stopword distribution.',
      'Section 3: Consequently, empirical benchmarks prove the structural robustness of fusion detectors under adversarial evaluation.'
    ].join('\n\n');

    const response = await request.post(`${backendBase}/api/humanize`, {
      headers: testAuthHeaders,
      data: {
        text: longText,
        tone: 'professional'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.humanized_text).toBeTruthy();
    expect(data.humanized_text.length).toBeGreaterThan(100);
  });

  // 5. UI Diff Rendering
  test('UI allows selecting tones and viewing before/after diff', async ({ page }) => {
    test.setTimeout(60000);
    // Intercept InsForge auth session to ensure authenticated user on /paraphrase
    await page.route('**/*insforge.app/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'e2e-user-123',
              email: 'test@verity.ai',
              name: 'Test Researcher'
            }
          }
        })
      });
    });

    // Intercept /api/humanize to ensure fast, deterministic UI verification
    await page.route('**/api/humanize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          humanized_text:
            'Also, it is essential to examine the mix of AI models to understand what they can do. As a result, teams improve their workflow smoothly.',
          provider: 'local_engine',
          tone: 'academic'
        })
      });
    });

    // Initialize authenticated user in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'verity_session_user',
        JSON.stringify({
          id: 'e2e-user-123',
          email: 'test@verity.ai',
          name: 'Test Researcher'
        })
      );
      window.localStorage.setItem(
        'verity_access_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci0xMjMiLCJleHAiOjI1MzQwMjMwMDd9.signature'
      );
    });

    await page.goto('/paraphrase');

    // Verify tone buttons exist
    await expect(page.locator('#tone-btn-natural')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#tone-btn-professional')).toBeVisible();
    await expect(page.locator('#tone-btn-academic')).toBeVisible();
    await expect(page.locator('#tone-btn-casual')).toBeVisible();

    // Select Academic tone
    await page.locator('#tone-btn-academic').click();

    // Enter text in textarea
    const textarea = page.locator('textarea');
    await textarea.fill(sampleRoboticText);

    // Click Humanize Text
    const transformBtn = page.getByRole('button', { name: /Humanize Text/i });
    await transformBtn.click();

    // Wait for transformed text / diff toggle to appear
    const diffToggle = page.locator('#diff-view-toggle');
    await expect(diffToggle).toBeVisible({ timeout: 15000 });

    // Toggle Diff View
    await diffToggle.click();

    // Confirm diff container is rendered with stats and chunks
    const diffContainer = page.locator('#diff-container');
    await expect(diffContainer).toBeVisible();
    await expect(page.getByText(/Added:/i)).toBeVisible();
    await expect(page.getByText(/Preserved:/i)).toBeVisible();
    await expect(page.getByText(/Replaced:/i)).toBeVisible();
  });
});
