export interface DiffChunk {
  type: 'unchanged' | 'removed' | 'added';
  value: string;
}

export interface DiffStats {
  originalWords: number;
  modifiedWords: number;
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
}

/**
 * Computes word-level diff between original and modified text using Longest Common Subsequence (LCS).
 */
export function computeWordDiff(original: string, modified: string): DiffChunk[] {
  if (!original && !modified) return [];
  if (!original) return [{ type: 'added', value: modified }];
  if (!modified) return [{ type: 'removed', value: original }];

  // Tokenize by word boundaries including trailing whitespace/punctuation
  const origTokens = original.match(/\S+|\s+/g) || [];
  const modTokens = modified.match(/\S+|\s+/g) || [];

  const n = origTokens.length;
  const m = modTokens.length;

  // LCS table (capped at reasonable lengths to ensure fast rendering)
  if (n * m > 1000000) {
    // For extraordinarily long texts, line-level chunking
    return [
      { type: 'removed', value: original },
      { type: 'added', value: modified }
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origTokens[i - 1].toLowerCase() === modTokens[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff chunks
  let i = n;
  let j = m;
  const reversedChunks: DiffChunk[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1].toLowerCase() === modTokens[j - 1].toLowerCase()) {
      reversedChunks.push({ type: 'unchanged', value: modTokens[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversedChunks.push({ type: 'added', value: modTokens[j - 1] });
      j--;
    } else if (i > 0) {
      reversedChunks.push({ type: 'removed', value: origTokens[i - 1] });
      i--;
    }
  }

  reversedChunks.reverse();

  // Merge contiguous chunks of same type
  const merged: DiffChunk[] = [];
  for (const chunk of reversedChunks) {
    if (merged.length > 0 && merged[merged.length - 1].type === chunk.type) {
      merged[merged.length - 1].value += chunk.value;
    } else {
      merged.push({ ...chunk });
    }
  }

  return merged;
}

/**
 * Computes descriptive statistics for a word diff without fabricating evasion metrics.
 */
export function getDiffStats(diffChunks: DiffChunk[]): DiffStats {
  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsUnchanged = 0;

  for (const chunk of diffChunks) {
    const wordCount = chunk.value.trim().split(/\s+/).filter(Boolean).length;
    if (chunk.type === 'added') wordsAdded += wordCount;
    else if (chunk.type === 'removed') wordsRemoved += wordCount;
    else wordsUnchanged += wordCount;
  }

  return {
    originalWords: wordsUnchanged + wordsRemoved,
    modifiedWords: wordsUnchanged + wordsAdded,
    wordsAdded,
    wordsRemoved,
    wordsUnchanged
  };
}
