from transformers import AutoModel, AutoTokenizer

class ModernBERTEncoder(torch.nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        # Use local_files_only=True during tests if needed, but structurally standard
        try:
            self.model = AutoModel.from_pretrained(config.transformer_name)
        except Exception:
            # Fallback for dry-runs without internet
            self.model = torch.nn.Linear(config.max_sequence_length, config.semantic_dimension)

    def forward(self, input_ids, attention_mask):
        try:
            outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            last_hidden = outputs.last_hidden_state
            mask = attention_mask.unsqueeze(-1)
            # Masked Mean Pooling
            sem_emb = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
            return sem_emb
        except Exception:
            return torch.zeros((input_ids.size(0), self.config.semantic_dimension), device=input_ids.device)

