from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_index_and_health():
    index = client.get("/")
    assert index.status_code == 200
    assert index.json()["success"] is True

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["success"] is True


def test_recommend_with_history():
    payload = {
        "interactions": [
            {"user_id": "u1", "product_id": "p1", "quantity": 2},
            {"user_id": "u2", "product_id": "p2", "quantity": 1},
        ],
        "products": [
            {"id": "p1", "title": "Phone", "category": "Electronics", "tags": ["mobile"]},
            {"id": "p2", "title": "Laptop", "category": "Electronics", "tags": ["work"]},
            {"id": "p3", "title": "Book", "category": "Books", "tags": ["reading"]},
        ],
        "user_id": "u1",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    recommendations = response.json()["recommendations"]
    assert isinstance(recommendations, list)
    assert all(item["product_id"] != "p1" for item in recommendations)


def test_recommend_without_history_falls_back_to_popularity():
    payload = {
        "interactions": [{"user_id": "u2", "product_id": "p2", "quantity": 4}],
        "products": [
            {"id": "p1", "title": "Phone", "category": "Electronics", "tags": ["mobile"]},
            {"id": "p2", "title": "Laptop", "category": "Electronics", "tags": ["work"]},
        ],
        "user_id": "new-user",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    assert response.json()["recommendations"][0]["product_id"] == "p2"


def test_recommend_accepts_mongo_id_fields():
    payload = {
        "interactions": [],
        "products": [
            {"_id": "64b000000000000000000001", "title": "Phone", "category": "Electronics", "tags": ["mobile"]},
            {"_id": "64b000000000000000000002", "title": "Laptop", "category": "Electronics", "tags": ["work"]},
        ],
        "user_id": "new-user",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    ids = [item["product_id"] for item in response.json()["recommendations"]]
    assert ids == ["64b000000000000000000001", "64b000000000000000000002"]


def test_recommend_ignores_products_without_ids():
    payload = {
        "interactions": [],
        "products": [
            {"title": "Phone", "category": "Electronics", "tags": ["mobile"]},
            {"title": "Laptop", "category": "Electronics", "tags": ["work"]},
        ],
        "user_id": "new-user",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    assert response.json()["recommendations"] == []


def test_forecast_returns_horizon():
    payload = {
        "sales_series": [
            {"date": "2026-01-01", "total": 100},
            {"date": "2026-01-02", "total": 140},
            {"date": "2026-01-03", "total": 180},
        ],
        "horizon_days": 3,
    }
    response = client.post("/forecast", json=payload)
    assert response.status_code == 200
    forecast = response.json()["forecast"]
    assert len(forecast) == 3
    assert all(point["predicted_total"] >= 0 for point in forecast)


def test_forecast_requires_two_points():
    response = client.post(
        "/forecast",
        json={"sales_series": [{"date": "2026-01-01", "total": 100}], "horizon_days": 2},
    )
    assert response.status_code == 200
    assert len(response.json()["forecast"]) == 2


def test_segment_customers():
    payload = {
        "customers": [
            {"user_id": "u1", "order_value": 120, "order_count": 2},
            {"user_id": "u2", "order_value": 80, "order_count": 1},
            {"user_id": "u3", "order_value": 900, "order_count": 8},
            {"user_id": "u4", "order_value": 1100, "order_count": 9},
        ],
        "n_clusters": 2,
    }
    response = client.post("/segment", json=payload)
    assert response.status_code == 200
    segments = response.json()["segments"]
    assert len(segments) == 4
    assert len({segment["segment"] for segment in segments}) == 2


def test_segment_requires_two_customers():
    response = client.post(
        "/segment",
        json={"customers": [{"user_id": "u1", "order_value": 10, "order_count": 1}]},
    )
    assert response.status_code == 200
    assert response.json()["segments"] == []
