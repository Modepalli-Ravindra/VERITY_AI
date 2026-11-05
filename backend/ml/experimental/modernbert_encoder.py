try:
    import torch
    _ModuleBase = torch.nn.Module
except ImportError:
    torch = None
    _ModuleBase = object

class ModernBERTEncoder(_ModuleBase):
    def __init__(self, config):
        if torch is not None:
            from transformers import AutoModel
            super().__init__()
            self.config = config
            self.model = AutoModel.from_pretrained(config.transformer_name)

    def forward(self, input_ids, attention_mask):
        outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
        last_hidden = outputs.last_hidden_state
        mask = attention_mask.unsqueeze(-1)
        sem_emb = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
        return sem_emb
