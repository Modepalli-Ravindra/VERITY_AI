class ModernBERTEncoder:
    """
    Isolated abstraction for ModernBERT encoding.
    Currently a structural placeholder to prevent unwanted downloads.
    """
    def __init__(self, config):
        self.config = config
        self.model = None
        self.tokenizer = None

    def load(self):
        # DO NOT download weights or external models during architecture phase
        pass

    def encode(self, input_ids, attention_mask):
        """
        Future implementation will pass inputs to ModernBERT 
        and apply the selected pooling strategy to yield
        a 768-D semantic representation.
        """
        pass
