import re
import math
from typing import List

class NLPFeatureExtractor:
    """
    Extracts additional NLP linguistic features for V5 experiment.
    These features complement the existing 20 stylometric features.
    """
    
    PRONOUNS = {'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 
                'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs'}
    PREPOSITIONS = {'in', 'on', 'at', 'to', 'for', 'with', 'about', 'against', 'between', 
                    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'over', 'under'}
    CONJUNCTIONS = {'and', 'but', 'or', 'so', 'because', 'although', 'unless', 'since', 'while'}
    AUXILIARY = {'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 
                 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must'}
    
    @staticmethod
    def count_syllables(word: str) -> int:
        word = word.lower()
        if len(word) <= 3:
            return 1
        word = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', word)
        word = re.sub(r'^y', '', word)
        syllables = len(re.findall(r'[aeiouy]{1,2}', word))
        return max(1, syllables)

    @classmethod
    def get_vector(cls, text: str) -> List[float]:
        cleaned = text.strip()
        if not cleaned:
            return [0.0] * 12

        words = re.findall(r'\b[A-Za-z0-9\'-]+\b', cleaned.lower())
        word_count = len(words)
        
        if word_count == 0:
            return [0.0] * 12
            
        sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned) if s.strip()]
        sentence_count = max(len(sentences), 1)

        # 1. POS approximations
        pronoun_ratio = sum(1 for w in words if w in cls.PRONOUNS) / word_count
        prep_ratio = sum(1 for w in words if w in cls.PREPOSITIONS) / word_count
        conj_ratio = sum(1 for w in words if w in cls.CONJUNCTIONS) / word_count
        aux_ratio = sum(1 for w in words if w in cls.AUXILIARY) / word_count
        
        # 2. N-gram repetition
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        unique_bigrams = set(bigrams)
        bigram_repetition = (len(bigrams) - len(unique_bigrams)) / max(len(bigrams), 1)
        
        trigrams = [f"{words[i]}_{words[i+1]}_{words[i+2]}" for i in range(len(words)-2)]
        unique_trigrams = set(trigrams)
        trigram_repetition = (len(trigrams) - len(unique_trigrams)) / max(len(trigrams), 1)

        # 3. Vocabulary concentration
        word_freqs = {}
        for w in words:
            word_freqs[w] = word_freqs.get(w, 0) + 1
        sorted_counts = sorted(word_freqs.values(), reverse=True)
        top_10_ratio = sum(sorted_counts[:10]) / word_count
        
        # 4. Sentence complexity
        words_per_sentence = [len(re.findall(r'\b[A-Za-z0-9\'-]+\b', s)) for s in sentences]
        avg_sentence_len = sum(words_per_sentence) / sentence_count
        complex_sentences = sum(1 for c in words_per_sentence if c > 20) / sentence_count
        
        # 5. Readability (Flesch Reading Ease approximation)
        total_syllables = sum(cls.count_syllables(w) for w in words)
        avg_syllables = total_syllables / word_count
        flesch_score = 206.835 - 1.015 * avg_sentence_len - 84.6 * avg_syllables
        
        word_complexity = sum(1 for w in words if cls.count_syllables(w) >= 3) / word_count
        
        # Normalize flesch score roughly to [0, 1] range for stability
        flesch_normalized = min(max(flesch_score / 100.0, 0.0), 1.0)
        
        return [
            pronoun_ratio,
            prep_ratio,
            conj_ratio,
            aux_ratio,
            bigram_repetition,
            trigram_repetition,
            top_10_ratio,
            complex_sentences,
            avg_syllables,
            flesch_normalized,
            word_complexity,
            float(len(words_per_sentence)) / 100.0 # length normalization
        ]
