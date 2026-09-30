import { test, expect } from '@playwright/test';

test.describe('paraphraser E2E', () => {
  test('paraphraser API converts robotic text to natural variation', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:8000/api/humanize', {
      data: {
        text: 'Furthermore, it is imperative to delve into the tapestry of AI models in order to analyze their capabilities.',
        mode: 'Balanced'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.humanized_text).toBeTruthy();
    expect(typeof data.humanized_text).toBe('string');
  });
});
