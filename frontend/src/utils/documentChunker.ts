/**
 * Document Chunker Utility
 * 
 * Splits arbitrary-length documents into bounded chunks for sequential humanization.
 * Preserves paragraph order, headings, lists, and section structure.
 */

export interface DocumentChunk {
  index: number;
  text: string;
}

/**
 * Counts words accurately, ignoring extra whitespace.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Splits text along paragraph boundaries into chunks bounded by maxChunkChars.
 * Headings, lists, and blank lines are preserved in order.
 */
export function chunkDocumentForHumanization(
  text: string,
  maxChunkChars = 2500
): string[] {
  const clean = text.trim();
  if (!clean || clean.length <= maxChunkChars) {
    return clean ? [clean] : [];
  }

  // Split on paragraph boundaries (double newlines)
  const rawParagraphs = clean.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentGroup: string[] = [];
  let currentChars = 0;

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // If an individual paragraph exceeds maxChunkChars, split on sentence boundaries
    if (trimmedPara.length > maxChunkChars) {
      if (currentGroup.length > 0) {
        chunks.push(currentGroup.join('\n\n'));
        currentGroup = [];
        currentChars = 0;
      }

      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmedPara];
      let subGroup: string[] = [];
      let subChars = 0;

      for (const sent of sentences) {
        const sTrim = sent.trim();
        if (!sTrim) continue;
        if (subChars + sTrim.length + 1 > maxChunkChars && subGroup.length > 0) {
          chunks.push(subGroup.join(' '));
          subGroup = [sTrim];
          subChars = sTrim.length;
        } else {
          subGroup.push(sTrim);
          subChars += sTrim.length + 1;
        }
      }
      if (subGroup.length > 0) {
        chunks.push(subGroup.join(' '));
      }
      continue;
    }

    if (currentChars + trimmedPara.length + 2 > maxChunkChars && currentGroup.length > 0) {
      chunks.push(currentGroup.join('\n\n'));
      currentGroup = [trimmedPara];
      currentChars = trimmedPara.length;
    } else {
      currentGroup.push(trimmedPara);
      currentChars += trimmedPara.length + 2;
    }
  }

  if (currentGroup.length > 0) {
    chunks.push(currentGroup.join('\n\n'));
  }

  return chunks.length > 0 ? chunks : [clean];
}
