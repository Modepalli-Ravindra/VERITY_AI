from backend.ml.verity_model import VerityV4Model
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model

class ModelRegistry:
    """
    Registry for managing model versions.
    V4-B remains the production model. V5 is experimental.
    """
    def __init__(self):
        # Instantiate V4-B safely as the production default
        self._production_model = VerityV4Model(unfreeze_layers=0)
        self._experimental_models = {}

    def get_production_model(self):
        return self._production_model

    def get_experimental_model(self, version: str):
        return self._experimental_models.get(version)

    def get_model(self, version: str):
        if version in ["production", "v4-b"]:
            return self.get_production_model()
        return self.get_experimental_model(version)

    def register_experimental_model(self, version: str, model):
        self._experimental_models[version] = model

    def load_v5_experiment(self):
        """Helper to load V5 without making it default."""
        config = V5Config(v5_enabled=True)
        v5_model = VerityV5Model(config)
        self.register_experimental_model("v5", v5_model)

