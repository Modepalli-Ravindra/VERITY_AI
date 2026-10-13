import { test, expect } from '@playwright/test';
import { 
  normalizeProbability, 
  extractAiProbability, 
  computeComparisonMetrics, 
  countWords 
} from '../src/utils/probability';

test.describe('Probability Normalization & Comparison Mathematical Utilities', () => {

  test('valid numeric probability in range [0, 1] formats correctly', () => {
    expect(normalizeProbability(0.8523)).toBe(0.8523);
    expect(normalizeProbability(0.0)).toBe(0.0);
    expect(normalizeProbability(1.0)).toBe(1.0);
    expect(normalizeProbability(0.5)).toBe(0.5);

    const norm = extractAiProbability({ ai_probability: 0.8523 });
    expect(norm.isValid).toBe(true);
    expect(norm.probability).toBe(0.8523);
    expect(norm.percentage).toBe(85);
    expect(norm.formattedPercentage).toBe('85%');
  });

  test('boundary values 0 and 1 never produce NaN or —', () => {
    const zero = extractAiProbability({ ai_probability: 0 });
    expect(zero.isValid).toBe(true);
    expect(zero.percentage).toBe(0);
    expect(zero.formattedPercentage).toBe('0%');

    const one = extractAiProbability({ ai_probability: 1 });
    expect(one.isValid).toBe(true);
    expect(one.percentage).toBe(100);
    expect(one.formattedPercentage).toBe('100%');
  });

  test('never treats missing, null, undefined, unparseable strings, Infinity, or NaN as valid scores', () => {
    expect(normalizeProbability(null)).toBeNull();
    expect(normalizeProbability(undefined)).toBeNull();
    expect(normalizeProbability('')).toBeNull();
    expect(normalizeProbability(NaN)).toBeNull();
    expect(normalizeProbability(Infinity)).toBeNull();
    expect(normalizeProbability(-Infinity)).toBeNull();
    expect(normalizeProbability('invalid_str')).toBeNull();
    expect(normalizeProbability(-0.5)).toBeNull();
    expect(normalizeProbability(1.5)).toBeNull(); // Out of [0, 1] bounds without flag

    const missingResult = extractAiProbability({});
    expect(missingResult.isValid).toBe(false);
    expect(missingResult.probability).toBeNull();
    expect(missingResult.percentage).toBeNull();
    expect(missingResult.formattedPercentage).toBe('—');

    const nullResult = extractAiProbability({ ai_probability: null });
    expect(nullResult.isValid).toBe(false);
    expect(nullResult.formattedPercentage).toBe('—');

    const errorPayload = extractAiProbability({ detail: 'Text length exceeds 20,000 character limit.' });
    expect(errorPayload.isValid).toBe(false);
    expect(errorPayload.formattedPercentage).toBe('—');
  });

  test('normalizes 0–100 percentage values ONLY when response schema explicitly defines it', () => {
    // Without explicit schema flag, 85 is out-of-bounds for standard [0, 1] probability
    expect(normalizeProbability(85, false)).toBeNull();
    const unflagged = extractAiProbability({ ai_probability: 85 });
    expect(unflagged.isValid).toBe(false);

    // With explicit flag: is_percentage: true
    expect(normalizeProbability(85, true)).toBe(0.85);
    const flagged = extractAiProbability({ ai_probability: 85, is_percentage: true });
    expect(flagged.isValid).toBe(true);
    expect(flagged.probability).toBe(0.85);
    expect(flagged.percentage).toBe(85);
    expect(flagged.formattedPercentage).toBe('85%');

    // Negative or > 100 percentage rejected even with flag
    expect(normalizeProbability(150, true)).toBeNull();
    expect(normalizeProbability(-10, true)).toBeNull();
  });

  test('ModernBERT V5 response compatibility', () => {
    const v5Response = {
      ai_probability: 0.8872,
      predicted_class: 'AI',
      threshold: 0.70,
      inference_time_ms: 110.2,
      model_version: 'V5-ModernBERT',
      active_model: 'ModernBERT-V5',
      detection_engine: 'ModernBERT-V5'
    };

    const norm = extractAiProbability(v5Response);
    expect(norm.isValid).toBe(true);
    expect(norm.percentage).toBe(89);
    expect(norm.formattedPercentage).toBe('89%');
    expect(norm.activeModel).toBe('ModernBERT-V5');
    expect(norm.detectionEngine).toBe('ModernBERT-V5');
    expect(norm.threshold).toBe(0.70);
  });

  test('DistilRoBERTa V2 response compatibility', () => {
    const v2Response = {
      classification: 'Likely AI Generated',
      ai_probability: 0.742,
      human_probability: 0.258,
      confidence: 'High',
      detection_engine: 'DistilRoBERTa-V2',
      model_version: 'V2',
      locked_threshold: 0.50,
      active_model: 'DistilRoBERTa-V2'
    };

    const norm = extractAiProbability(v2Response);
    expect(norm.isValid).toBe(true);
    expect(norm.percentage).toBe(74);
    expect(norm.formattedPercentage).toBe('74%');
    expect(norm.activeModel).toBe('DistilRoBERTa-V2');
    expect(norm.threshold).toBe(0.50);
  });

  test('calculates comparative signal change only when both scores are valid', () => {
    const orig = { ai_probability: 0.92, active_model: 'ModernBERT-V5', threshold: 0.70 };
    const hum = { ai_probability: 0.15, active_model: 'ModernBERT-V5', threshold: 0.70 };

    const comp = computeComparisonMetrics(orig, hum);
    expect(comp.canCompare).toBe(true);
    expect(comp.originalScore.percentage).toBe(92);
    expect(comp.adversarialScore.percentage).toBe(15);
    // Delta: 15 - 92 = -77 percentage points
    expect(comp.signalChange).toBe(-77);
    expect(comp.formattedSignalChange).toBe('-77 percentage points');
    expect(comp.errorMessage).toBeNull();
  });

  test('displays — and clear error message when either score is unavailable', () => {
    const validOrig = { ai_probability: 0.90 };
    const invalidHum = { error: 'LLM service failure' };

    const comp = computeComparisonMetrics(validOrig, invalidHum);
    expect(comp.canCompare).toBe(false);
    expect(comp.originalScore.isValid).toBe(true);
    expect(comp.adversarialScore.isValid).toBe(false);
    expect(comp.signalChange).toBeNull();
    expect(comp.formattedSignalChange).toBe('—');
    expect(comp.errorMessage).toBe('Unable to calculate comparison: detection score unavailable');
  });

  test('word count calculation operates independently and accurately', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t  ')).toBe(0);
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('The quick brown fox jumps over the lazy dog.')).toBe(9);
    expect(countWords('Multiple   spaces\nand\n\nnewlines')).toBe(4);
  });
});
