import { test, expect } from '@playwright/test';

test.describe('Full Document Humanizer & Adversarial Rewrite Workflow', () => {
  const backendBase = 'http://127.0.0.1:8000';
  const testAuthHeaders = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.signature'
  };

  test.beforeEach(async ({ page }) => {
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
      // Valid unexpired test JWT (exp far in the future: year 2035)
      window.localStorage.setItem(
        'verity_access_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci0xMjMiLCJleHAiOjI1MzQwMjMwMDd9.signature'
      );
    });
  });

  test('1. Full document state transfer from Analyzer to Paraphrase carries complete 7,784-word text', async ({ page }) => {
    test.setTimeout(60000);

    // Generate realistic 7,784-word document
    const wordsPerPara = 50;
    const numParas = Math.ceil(7784 / wordsPerPara);
    const paragraphs: string[] = [];
    let currentWords = 0;

    for (let i = 1; i <= numParas; i++) {
      const remaining = 7784 - currentWords;
      const count = Math.min(wordsPerPara, remaining);
      const text = `Section ${i}: ` + Array.from({ length: count - 2 }, (_, idx) => `term${idx}`).join(' ') + '.';
      paragraphs.push(text);
      currentWords += count;
      if (currentWords >= 7784) break;
    }
    const full7784Text = paragraphs.join('\n\n');
    const actualTotalWords = full7784Text.split(/\s+/).filter(Boolean).length;
    expect(actualTotalWords).toBe(7784);

    // 50 evaluated chunks representing 904 words (bounded evaluation sampling)
    const segments50 = Array.from({ length: 50 }, (_, idx) => {
      const wordsInChunk = idx < 4 ? 19 : 18; // 4*19 + 46*18 = 76 + 828 = 904 words
      return {
        segment_index: idx + 1,
        text: `Sampled Chunk ${idx + 1}: ` + Array.from({ length: wordsInChunk - 3 }, (_, k) => `sample${k}`).join(' ') + '.',
        ai_probability: 0.92,
        human_probability: 0.08,
        classification: 'Likely AI Generated',
        word_count: wordsInChunk
      };
    });
    const segmentsWordCount = segments50.reduce((acc, s) => acc + s.word_count, 0);
    expect(segmentsWordCount).toBe(904);

    // Intercept analyze-file endpoint
    await page.route('**/api/analyze-file', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          classification: 'Likely AI Generated',
          ai_probability: 0.92,
          human_probability: 0.08,
          confidence: 'High',
          explanation: 'Multi-segment analysis across 50 sections of Final guide.docx indicates strong AI generation.',
          extracted_text: full7784Text,
          segments: segments50,
          document_meta: {
            filename: 'Final guide.docx',
            file_type: 'DOCX',
            total_words: 7784,
            total_characters: full7784Text.length,
            chunks_analyzed: 50
          }
        })
      });
    });

    await page.goto('/analyze', { waitUntil: 'domcontentloaded' });

    // Switch to Upload Mode
    const uploadBtn = page.getByRole('button', { name: /Upload File/i });
    await uploadBtn.click();

    // Set file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Final guide.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('MOCK_DOCX_BUFFER')
    });

    // Run Analysis
    const runBtn = page.getByRole('button', { name: /ANALYZE DOCUMENT/i });
    await expect(runBtn).toBeEnabled({ timeout: 10000 });
    await runBtn.click();

    // Confirm that Document Meta Banner displays 7784 Words and 50 Evaluated Chunks
    await expect(page.getByText('Final guide.docx')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/7784 Words/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/50 Evaluated Chunks/i)).toBeVisible({ timeout: 20000 });

    // Click Adversarial Rewrite button
    const rewriteBtn = page.getByRole('button', { name: /ADVERSARIAL REWRITE/i });
    await expect(rewriteBtn).toBeVisible({ timeout: 15000 });
    await rewriteBtn.click();

    // Verify URL transitioned to /paraphrase
    await expect(page).toHaveURL(/.*paraphrase/);

    // Verify textarea contains the COMPLETE 7,784-word document, NOT just the 904-word analysis subset
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    const content = await textarea.inputValue();
    const wordsInInput = content.trim().split(/\s+/).filter(Boolean).length;

    expect(wordsInInput).toBe(7784);
    expect(wordsInInput).not.toBe(904);
    expect(content).toContain('Section 1:');
    expect(content).toContain(`Section ${numParas}:`);

    // Confirm that the UI word count indicator displays 7784
    const wordDisplay = page.locator('span:has-text("Words:") strong');
    await expect(wordDisplay).toHaveText('7784');
  });

  test('2. Sequential document humanization renders progress and complete output with word counts', async ({ page }) => {
    test.setTimeout(60000);
    // Generate multi-section text (> 3,000 characters to trigger multi-chunk batching)
    const sections = Array.from({ length: 10 }, (_, i) => 
      `Chapter ${i + 1}: Furthermore, artificial neural models optimize text structure seamlessly across modern distributed environments. ` +
      `In addition, empirical stylometric analysis reveals key indicators of automated authorship across massive natural language corpora. ` +
      `Consequently, forensic classifiers evaluate sentence burstiness and perplexity distributions to determine provenance with high statistical confidence.`
    );
    const documentText = sections.join('\n\n');

    await page.route('**/api/humanize', async (route) => {
      const req = route.request();
      const body = JSON.parse(req.postData() || '{}');
      
      // Return transformed chunk
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          humanized_text: body.text.replace(/Furthermore,/g, 'Also,').replace(/Consequently,/g, 'As a result,'),
          provider: 'local_engine',
          tone: body.tone || 'natural'
        })
      });
    });

    await page.goto('/paraphrase', { waitUntil: 'domcontentloaded' });

    // Fill textarea with multi-section document
    const textarea = page.locator('textarea');
    await textarea.fill(documentText);

    // Click Humanize Text
    const transformBtn = page.getByRole('button', { name: /Humanize Text/i });
    await transformBtn.click();

    // Verify that output appears and is NOT two lines
    const outputWordCount = page.locator('#output-word-count');
    await expect(outputWordCount).toBeVisible({ timeout: 20000 });

    // Confirm that output contains all chapters
    const textOutput = page.locator('.whitespace-pre-wrap');
    await expect(textOutput).toBeVisible();
    const renderedText = await textOutput.innerText();

    expect(renderedText).toContain('Chapter 1:');
    expect(renderedText).toContain('Chapter 10:');
    expect(renderedText.length).toBeGreaterThan(2500);

    // Confirm word count is displayed
    const wordCountText = await outputWordCount.innerText();
    expect(wordCountText).toMatch(/words:/i);
  });

  test('3. Partial chunk failure halts transformation and displays visible error without partial output', async ({ page }) => {
    const sections = Array.from({ length: 15 }, (_, i) => 
      `Section ${i + 1}: Furthermore, advanced transformers optimize sentence flow seamlessly across diverse production workloads. ` +
      `Consequently, organizations utilize these models to enhance operational productivity and synthesize valuable insights across teams.`
    );
    const documentText = sections.join('\n\n');

    await page.route('**/api/humanize', async (route) => {
      const req = route.request();
      const body = JSON.parse(req.postData() || '{}');
      if (body.text && body.text.includes('Section 2:')) {
        // Fail on section 2
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Provider token exhaustion on section 2' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            humanized_text: 'Transformed chunk output text',
            provider: 'local_engine',
            tone: 'natural'
          })
        });
      }
    });

    await page.goto('/paraphrase');
    const textarea = page.locator('textarea');
    await textarea.fill(documentText);

    const transformBtn = page.getByRole('button', { name: /Humanize Text/i });
    await transformBtn.click();

    // Confirm explicit error is displayed to user
    await expect(page.getByText(/Transformation halted at section/i)).toBeVisible({ timeout: 15000 });

    // Confirm that partial output was NOT set as successful output
    await expect(page.getByText('Output will appear here')).toBeVisible();
  });

  test('5. File upload request transmits valid Authorization Bearer header', async ({ page }) => {
    let capturedAuthHeader: string | null = null;

    await page.route('**/api/analyze-file', async (route) => {
      capturedAuthHeader = route.request().headers()['authorization'] || null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          classification: 'Likely AI Generated',
          ai_probability: 0.88,
          human_probability: 0.12,
          confidence: 'High',
          explanation: 'Verified document analysis with valid authentication header.',
          extracted_text: 'Sample document text for authenticated analysis.',
          segments: [],
          document_meta: {
            filename: 'Final guide.docx',
            file_type: 'DOCX',
            total_words: 6,
            total_characters: 47,
            chunks_analyzed: 1
          }
        })
      });
    });

    await page.goto('/analyze');
    await page.getByRole('button', { name: /Upload File/i }).click();

    // Upload sample file directly via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Final guide.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('Mock file buffer for authenticated upload test')
    });

    await page.getByRole('button', { name: /Analyze Document/i }).click();

    // Verify Authorization header was sent with Bearer token
    await expect.poll(() => capturedAuthHeader).toBeTruthy();
    expect(capturedAuthHeader).toMatch(/^Bearer eyJ/i);
  });

  test('6. Missing or expired session displays sign-in prompt and blocks unauthenticated request', async ({ page }) => {
    let networkRequestAttempted = false;
    await page.route('**/api/analyze-file', async (route) => {
      networkRequestAttempted = true;
      await route.abort();
    });

    await page.goto('/analyze');
    await page.getByRole('button', { name: /Upload File/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Final guide.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('Mock file buffer')
    });

    // Simulate session expiration / missing access token before triggering analysis
    await page.evaluate(() => {
      if ((window as any).__clearVerityTokens) {
        (window as any).__clearVerityTokens();
      }
      window.localStorage.removeItem('verity_access_token');
    });

    await page.getByRole('button', { name: /Analyze Document/i }).click();

    // UI displays authentication/session prompt
    await expect(page.getByText(/session has expired or you are not signed in/i)).toBeVisible({ timeout: 5000 });
    // "Sign In" button is rendered in the error banner
    await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible();

    // Unauthenticated request was NOT sent to the network
    expect(networkRequestAttempted).toBe(false);
  });
});
