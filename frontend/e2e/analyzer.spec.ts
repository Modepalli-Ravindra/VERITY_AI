import { test, expect } from '@playwright/test';

test.describe('Analyzer & paraphraser Backend E2E API Flow', () => {
  test('direct API call to /api/analyze returns valid probabilities', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:8000/api/analyze', {
      data: {
        text: 'Furthermore, it is imperative to delve into the tapestry of modern AI models and stylometric feature fusion.'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body).toHaveProperty('classification');
    expect(body).toHaveProperty('ai_probability');
    expect(body).toHaveProperty('human_probability');
    expect(body).toHaveProperty('explanation');
    expect(body).toHaveProperty('stylometric_features');
  });

  test('direct API call to /api/humanize returns rewritten text', async ({ request }) => {
    test.setTimeout(15000);
    const response = await request.post('http://127.0.0.1:8000/api/humanize', {
      data: {
        text: 'Furthermore, it is imperative to explore natural prose.',
        provider: 'auto'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('humanized_text');
    expect(body).toHaveProperty('provider');
    expect(body.humanized_text.length).toBeGreaterThan(0);
  });
});
