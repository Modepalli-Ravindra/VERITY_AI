import unicodedata
import re

def preprocess_text(text: str) -> str:
    """
    Shared preprocessing function for VERITY V2.
    Must be used identically across training, validation, RAID evaluation,
    and live API inference.
    
    Operations:
    1. NFKC Unicode normalization
    2. Removal of dangerous control characters (excluding standard whitespace like \n, \t, \r)
    3. Normalization of excessive whitespace (e.g., 3+ consecutive newlines -> 2 newlines, 2+ consecutive spaces -> 1 space)
    4. Preservation of casing, meaningful punctuation, and natural language structure.
    """
    if not text:
        return ""
        
    # 1. NFKC Normalization
    normalized = unicodedata.normalize("NFKC", text)
    
    # 2. Strip dangerous control characters (ASCII 0-31 except \t, \n, \r, and ASCII 127-159)
    # Replaces control chars with empty string
    cleaned_chars = []
    for char in normalized:
        cp = ord(char)
        if (cp < 32 and char not in ('\t', '\n', '\r')) or (127 <= cp <= 159):
            continue
        cleaned_chars.append(char)
    cleaned = "".join(cleaned_chars)
    
    # 3. Normalize excessive whitespace
    # Replace carriage returns with standard newlines
    cleaned = cleaned.replace('\r\n', '\n').replace('\r', '\n')
    
    # Replace multiple spaces/tabs on a single line with a single space
    lines = cleaned.split('\n')
    processed_lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in lines]
    
    # Collapse more than 2 consecutive blank lines into 2 blank lines
    text_processed = '\n'.join(processed_lines)
    text_processed = re.sub(r'\n{3,}', '\n\n', text_processed)
    
    return text_processed.strip()
