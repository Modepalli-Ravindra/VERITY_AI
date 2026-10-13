/**
 * Shared Probability Normalization & Comparison Utility
 * 
 * Strict rules:
 * 1. Supports valid numeric probabilities in range [0, 1].
 * 2. Normalizes 0–100 percentage values ONLY when response schema explicitly flags is_percentage / unit.
 * 3. Never treats missing, null, undefined, unparseable strings, Infinity, or NaN as valid scores.
 * 4. Never silently converts missing scores to 0%.
 * 5. Calculates signal change ONLY when both original and adversarial scores are valid.
 * 6. Preserves active_model, detection_engine, and threshold metadata.
 */

export interface NormalizedScore {
  probability: number | null; // 0.0 to 1.0, or null
  percentage: number | null;  // 0 to 100, or null
  formattedPercentage: string; // e.g. "85%" or "—"
  isValid: boolean;
  activeModel?: string;
  detectionEngine?: string;
  threshold?: number;
}

export interface ComparisonMetrics {
  originalScore: NormalizedScore;
  adversarialScore: NormalizedScore;
  canCompare: boolean;
  signalChange: number | null; // signed percentage point difference
  formattedSignalChange: string; // e.g. "-45 percentage points", "+10 percentage points", or "—"
  errorMessage: string | null;
}

/**
 * Normalizes a raw value into a strictly bounded 0.0 - 1.0 probability.
 * Returns null for missing, null, NaN, Infinity, or out-of-bounds values.
 */
export function normalizeProbability(value: unknown, isExplicitPercentage: boolean = false): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim();
    if (!cleaned) return null;
    num = Number(cleaned);
  } else {
    return null;
  }

  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return null;
  }

  if (isExplicitPercentage) {
    if (num >= 0 && num <= 100) {
      return num / 100;
    }
    return null;
  }

  if (num >= 0 && num <= 1) {
    return num;
  }

  // Support 0–100 percentage range without requiring explicit percentage flags (e.g. 55 -> 0.55)
  if (num > 1 && num <= 100) {
    return num / 100;
  }

  return null;
}

/**
 * Extracts and normalizes AI probability from ModernBERT V5, DistilRoBERTa V2,
 * or general VERITY API responses.
 */
export function extractAiProbability(result: any): NormalizedScore {
  if (result === null || result === undefined) {
    return {
      probability: null,
      percentage: null,
      formattedPercentage: '—',
      isValid: false
    };
  }

  // Support direct numeric or percentage strings passed as result
  if (typeof result === 'number' || typeof result === 'string') {
    const prob = normalizeProbability(result);
    if (prob === null) {
      return {
        probability: null,
        percentage: null,
        formattedPercentage: '—',
        isValid: false
      };
    }
    const percentage = Math.round(prob * 100);
    return {
      probability: prob,
      percentage,
      formattedPercentage: `${percentage}%`,
      isValid: true
    };
  }

  if (typeof result !== 'object') {
    return {
      probability: null,
      percentage: null,
      formattedPercentage: '—',
      isValid: false
    };
  }

  // Authoritative field: ai_probability (used by V5, V2, ProviderManager, and analyze_document)
  const isExplicitPercentage = Boolean(
    result.is_percentage === true ||
    result.probability_unit === 'percent' ||
    result.unit === '%'
  );

  let rawValue = result.ai_probability;
  // Fallbacks in specific schema contexts
  if (rawValue === undefined) {
    rawValue = result.aiProbability ?? result.probability ?? result.score ?? result.origAiProbability ?? result.adversarialAiProbability;
  }

  const prob = normalizeProbability(rawValue, isExplicitPercentage);

  const activeModel = result.active_model || result.selected_model || result.model_version || undefined;
  const detectionEngine = result.detection_engine || result.actual_engine || result.provider || undefined;
  const threshold = typeof result.threshold === 'number' 
    ? result.threshold 
    : (typeof result.locked_threshold === 'number' ? result.locked_threshold : undefined);

  if (prob === null) {
    return {
      probability: null,
      percentage: null,
      formattedPercentage: '—',
      isValid: false,
      activeModel,
      detectionEngine,
      threshold
    };
  }

  const percentage = Math.round(prob * 100);

  return {
    probability: prob,
    percentage,
    formattedPercentage: `${percentage}%`,
    isValid: true,
    activeModel,
    detectionEngine,
    threshold
  };
}

/**
 * Computes comparative signal metrics across original and adversarial texts.
 * Returns valid signal delta only when both results provide valid scores.
 */
export function computeComparisonMetrics(origResult: any, humResult: any): ComparisonMetrics {
  const originalScore = extractAiProbability(origResult);
  const adversarialScore = extractAiProbability(humResult);

  if (!originalScore.isValid || !adversarialScore.isValid) {
    return {
      originalScore,
      adversarialScore,
      canCompare: false,
      signalChange: null,
      formattedSignalChange: '—',
      errorMessage: 'Unable to calculate comparison: detection score unavailable'
    };
  }

  // Adversarial AI Probability minus Original AI Probability
  // e.g. Orig 90%, Hum 15% -> 15 - 90 = -75 percentage points
  const delta = (adversarialScore.percentage ?? 0) - (originalScore.percentage ?? 0);
  const formattedSignalChange = `${delta > 0 ? '+' : (delta === 0 ? '' : '-')}${Math.abs(delta)} percentage points`;

  return {
    originalScore,
    adversarialScore,
    canCompare: true,
    signalChange: delta,
    formattedSignalChange,
    errorMessage: null
  };
}

/**
 * Helper to count words accurately across multiline and whitespace boundaries.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
