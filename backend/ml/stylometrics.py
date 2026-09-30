import re
import math
from typing import Dict, Any, List

class StylometricExtractor:
    """
    Extracts 20 linguistic, syntactic, and stylometric features from raw input text.
    These features complement deep Transformer embeddings in the fusion model.
    """

    TRANSITION_WORDS = {
        'furthermore', 'moreover', 'consequently', 'nevertheless', 'nonetheless',
        'subsequently', 'henceforth', 'accordingly', 'imperative', 'crucial',
        'pivotal', 'delve', 'tapestry', 'testament', 'underscore', 'paramount'
    }

    STOP_WORDS = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'with', 'about', 'against', 'between', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off',
        'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
        'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
        'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
        'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
        'just', 'don', 'should', 'now', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did',
        'doing', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
        'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
        'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
        'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who'
    }

    FEATURE_NAMES: List[str] = [
        "char_count",
        "word_count",
        "sentence_count",
        "paragraph_count",
        "avg_sentence_length",
        "sentence_length_variance",
        "avg_word_length",
        "vocabulary_size",
        "type_token_ratio",
        "punctuation_count",
        "comma_freq",
        "period_freq",
        "question_freq",
        "exclamation_freq",
        "quote_freq",
        "colon_semicolon_freq",
        "digit_freq",
        "uppercase_ratio",
        "lowercase_ratio",
        "stopword_ratio"
    ]

    @classmethod
    def get_vector(cls, text: str) -> List[float]:
        """
        Extracts a 20-dimensional numerical feature vector for machine learning / PyTorch model input.
        """
        cleaned = text.strip()
        if not cleaned:
            return [0.0] * 20

        char_count = float(len(cleaned))
        paragraphs = [p.strip() for p in cleaned.split('\n') if p.strip()]
        paragraph_count = float(max(len(paragraphs), 1))

        sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned) if s.strip()]
        sentence_count = float(max(len(sentences), 1))

        words = re.findall(r'\b[A-Za-z0-9\'-]+\b', cleaned)
        word_count = float(len(words))

        if word_count == 0.0:
            return [char_count, 0.0, sentence_count, paragraph_count] + [0.0] * 16

        words_per_sentence = [float(len(re.findall(r'\b[A-Za-z0-9\'-]+\b', s))) for s in sentences]
        avg_sentence_len = sum(words_per_sentence) / sentence_count
        variance = sum((x - avg_sentence_len) ** 2 for x in words_per_sentence) / sentence_count

        word_lengths = [float(len(w)) for w in words]
        avg_word_len = sum(word_lengths) / word_count

        unique_words = set(w.lower() for w in words)
        vocab_size = float(len(unique_words))
        ttr = vocab_size / word_count

        punctuation_count = float(len(re.findall(r'[^\w\s]', cleaned)))
        comma_freq = float(cleaned.count(',')) / word_count
        period_freq = float(cleaned.count('.')) / word_count
        question_freq = float(cleaned.count('?')) / word_count
        exclamation_freq = float(cleaned.count('!')) / word_count
        quote_freq = float(cleaned.count('"') + cleaned.count("'")) / word_count
        colon_semicolon_freq = float(cleaned.count(':') + cleaned.count(';')) / word_count

        digit_freq = float(sum(1 for c in cleaned if c.isdigit())) / char_count
        uppercase_ratio = float(sum(1 for c in cleaned if c.isupper())) / char_count
        lowercase_ratio = float(sum(1 for c in cleaned if c.islower())) / char_count

        lower_words = [w.lower() for w in words]
        stopword_count = float(sum(1 for w in lower_words if w in cls.STOP_WORDS))
        stopword_ratio = stopword_count / word_count

        return [
            char_count,
            word_count,
            sentence_count,
            paragraph_count,
            avg_sentence_len,
            variance,
            avg_word_len,
            vocab_size,
            ttr,
            punctuation_count,
            comma_freq,
            period_freq,
            question_freq,
            exclamation_freq,
            quote_freq,
            colon_semicolon_freq,
            digit_freq,
            uppercase_ratio,
            lowercase_ratio,
            stopword_ratio
        ]

    @classmethod
    def extract_features(cls, text: str) -> Dict[str, Any]:
        """
        Legacy dictionary representation for backward compatibility and human-readable explanations.
        """
        vector = cls.get_vector(text)
        cleaned = text.strip()
        if not cleaned:
            return {
                "sentence_length": 0.0,
                "vocabulary_diversity": 0.0,
                "punctuation_score": 0.0,
                "pos_features": {"nouns": 0, "verbs": 0, "adjectives": 0, "transitions": 0},
                "stylometric_summary": "Empty input text provided.",
                "word_count": 0,
                "character_count": 0,
                "feature_vector": vector
            }

        word_count = int(vector[1])
        char_count = int(vector[0])
        avg_sentence_len = vector[4]
        sentence_variance = vector[5]
        sentence_len_std = math.sqrt(sentence_variance)
        ttr = vector[8]
        punct_score = vector[9] / (word_count or 1)

        words = re.findall(r'\b[A-Za-z0-9\'-]+\b', cleaned)
        lower_words = [w.lower() for w in words]
        transition_matches = sum(1 for w in lower_words if w in cls.TRANSITION_WORDS)
        ly_adverbs = sum(1 for w in lower_words if w.endswith('ly'))
        tion_nouns = sum(1 for w in lower_words if w.endswith('tion') or w.endswith('ment'))
        ing_verbs = sum(1 for w in lower_words if w.endswith('ing'))

        pos_features = {
            "sentence_std_dev": round(sentence_len_std, 2),
            "formal_transitions": transition_matches,
            "nominalizations": tion_nouns,
            "adverbs": ly_adverbs,
            "participles": ing_verbs
        }

        signals = []
        if sentence_len_std < 3.0 and vector[2] > 2:
            signals.append("Highly uniform sentence structures (typical of AI language models)")
        elif sentence_len_std > 7.0:
            signals.append("High burstiness and varied sentence length (indicative of human writing)")

        if transition_matches >= 2:
            signals.append(f"Elevated frequency of formal transition vocabulary ({transition_matches} instances)")

        if ttr < 0.45 and word_count > 50:
            signals.append("Lower vocabulary variance with repetitive phrasing")
        elif ttr > 0.70:
            signals.append("Rich vocabulary diversity with high lexical variation")

        summary = "; ".join(signals) if signals else "Balanced sentence rhythm and standard lexical distribution."

        return {
            "sentence_length": round(avg_sentence_len, 2),
            "vocabulary_diversity": round(ttr, 3),
            "punctuation_score": round(punct_score, 3),
            "pos_features": pos_features,
            "stylometric_summary": summary,
            "word_count": word_count,
            "character_count": char_count,
            "feature_vector": vector
        }

