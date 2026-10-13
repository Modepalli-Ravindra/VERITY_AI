import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

from backend.api.auth import get_current_user

class FakeUser:
    def __init__(self, uid: str = "test-v5-user"):
        self.id = uid
        self.email = "test@verity.ai"

app.dependency_overrides[get_current_user] = lambda: FakeUser()
client = TestClient(app)

def test_v5_experimental_analyze():
    response = client.post(
        "/api/experimental/v5/analyze",
        json={"text": "Artificial intelligence represents a significant advancement in computer science, enabling machines to perform tasks that typically require human cognitive functions."}
    )
    
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    
    data = response.json()
    assert "ai_probability" in data
    assert "predicted_class" in data
    assert "threshold" in data
    assert "inference_time_ms" in data
    assert "model_version" in data
    
    assert data["model_version"] == "V5-ModernBERT"
    assert isinstance(data["ai_probability"], float)
    assert data["predicted_class"] in ["Human", "AI"]
