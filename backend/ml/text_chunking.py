import re
from typing import List

def chunk_text(text: str, min_length: int = 50) -> List[str]:
    """
    Splits text into paragraph or sentence-level segments for detailed reporting.
    Maintains backward compatibility with Slice 1.
    """
    # Try splitting by paragraphs first
    chunks = [p.strip() for p in text.split("\n\n") if len(p.strip()) >= min_length]
    
    if not chunks:
        # If no paragraphs >= min_length, split by newlines
        chunks = [p.strip() for p in text.split("\n") if len(p.strip()) >= min_length]
        
    if not chunks:
        # If still no chunks, try sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = [s.strip() for s in sentences if len(s.strip()) >= min_length]
        
    if not chunks and len(text.strip()) >= min_length:
        chunks = [text.strip()]
        
    return chunks


def chunk_document_bounded(
    text: str,
    max_chunk_chars: int = 1500,
    min_chunk_chars: int = 50,
    max_chunks: int = 50
) -> List[str]:
    """
    Splits arbitrary-length documents into bounded chunks suitable for model evaluation.
    - Ensures each chunk is within model token limits (~1500 characters, ~250-300 words).
    - Caps total evaluated chunks at max_chunks to prevent unbounded computation.
    - If a single paragraph is too large, decomposes it into sentence-based chunks.
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    # Initial split by double newlines (paragraphs)
    raw_paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    if not raw_paragraphs:
        raw_paragraphs = [clean_text]

    refined_chunks: List[str] = []

    for para in raw_paragraphs:
        if len(para) <= max_chunk_chars:
            if len(para) >= min_chunk_chars:
                refined_chunks.append(para)
            elif refined_chunks:
                # Merge small fragment with previous chunk if within bounds
                combined = f"{refined_chunks[-1]}\n\n{para}"
                if len(combined) <= max_chunk_chars:
                    refined_chunks[-1] = combined
                else:
                    refined_chunks.append(para)
            else:
                refined_chunks.append(para)
        else:
            # Paragraph is too long: split into sentence blocks
            sentences = re.split(r'(?<=[.!?])\s+', para)
            current_block = []
            current_len = 0

            for sent in sentences:
                sent_len = len(sent.strip())
                if not sent_len:
                    continue
                if current_len + sent_len + 1 > max_chunk_chars and current_block:
                    block_text = " ".join(current_block).strip()
                    if len(block_text) >= min_chunk_chars:
                        refined_chunks.append(block_text)
                    current_block = [sent.strip()]
                    current_len = sent_len
                else:
                    current_block.append(sent.strip())
                    current_len += sent_len + 1

            if current_block:
                block_text = " ".join(current_block).strip()
                if len(block_text) >= min_chunk_chars:
                    refined_chunks.append(block_text)
                elif refined_chunks:
                    # Append to previous chunk if possible
                    combined = f"{refined_chunks[-1]} {block_text}"
                    if len(combined) <= max_chunk_chars:
                        refined_chunks[-1] = combined
                    else:
                        refined_chunks.append(block_text)

    # Filter out any lingering fragments below min_chunk_chars if multiple chunks exist
    if len(refined_chunks) > 1:
        valid_chunks = [c for c in refined_chunks if len(c.strip()) >= min_chunk_chars]
        if valid_chunks:
            refined_chunks = valid_chunks

    # If document produced 0 chunks but total text >= min_chunk_chars, fallback to full text
    if not refined_chunks and len(clean_text) >= min_chunk_chars:
        refined_chunks = [clean_text[:max_chunk_chars]]

    # Bound to max_chunks (if exceeded, take evenly spaced representative sample)
    if len(refined_chunks) > max_chunks:
        step = len(refined_chunks) / max_chunks
        sampled_indices = [int(i * step) for i in range(max_chunks)]
        refined_chunks = [refined_chunks[i] for i in sampled_indices]

    return refined_chunks
