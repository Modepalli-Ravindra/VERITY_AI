import pytest
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.experimental.modernbert_encoder import ModernBERTEncoder
from backend.ml.model_registry import ModelRegistry
from backend.ml.verity_model import VerityV4Model

def test_v5_config_loads():
    config = V5Config()
    assert config.model_version == "v5-experimental"
    assert config.transformer_name == "answerdotai/ModernBERT-base"
    assert config.v5_enabled is False
    assert config.semantic_dimension == 768

def test_v5_model_import_and_isolation():
    config = V5Config()
    model = VerityV5Model(config)
    assert model.config.stylometric_dimension == 20
    assert model.fusion_head is not None
    assert isinstance(model.encoder, ModernBERTEncoder)

def test_v4_remains_production_default():
    registry = ModelRegistry()
    prod_model = registry.get_model("production")
    assert isinstance(prod_model, VerityV4Model)

def test_v5_is_identified_as_experimental():
    registry = ModelRegistry()
    registry.load_v5_experiment()
    exp_model = registry.get_model("v5")
    assert isinstance(exp_model, VerityV5Model)
    assert isinstance(registry.get_model("production"), VerityV4Model)

