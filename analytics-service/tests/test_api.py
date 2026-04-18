from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_recommend():
    payload = {
        "interactions": [{"user_id": "u1", "product_id": "p1", "quantity": 2}],
        "products": [
            {"id": "p1", "title": "Phone", "category": "Electronics", "tags": ["mobile"]},
            {"id": "p2", "title": "Laptop", "category": "Electronics", "tags": ["work"]},
        ],
        "user_id": "u1",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    assert "recommendations" in response.json()
