from datetime import date, timedelta

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


def test_recommend_hybrid_prefers_similar_products():
    payload = {
        "interactions": [{"user_id": "u1", "product_id": "p1", "quantity": 3}],
        "products": [
            {"id": "p1", "title": "Trail Running Shoes", "category": "Fitness", "tags": ["running", "outdoor"]},
            {"id": "p2", "title": "Performance Running Socks", "category": "Fitness", "tags": ["running", "comfort"]},
            {"id": "p3", "title": "Ceramic Coffee Mug", "category": "Home", "tags": ["kitchen", "ceramic"]},
            {"id": "p4", "title": "Yoga Mat", "category": "Fitness", "tags": ["yoga", "fitness"]},
        ],
        "user_id": "u1",
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["strategy"] == "hybrid_tfidf_popularity"
    ids = [item["product_id"] for item in body["recommendations"]]
    assert ids[0] == "p2"
    assert "p1" not in ids


def test_recommend_aggregate_scope_uses_global_profile():
    payload = {
        "interactions": [
            {"user_id": "u1", "product_id": "p1", "quantity": 2},
            {"user_id": "u2", "product_id": "p4", "quantity": 1},
        ],
        "products": [
            {"id": "p1", "title": "Trail Running Shoes", "category": "Fitness", "tags": ["running", "outdoor"]},
            {"id": "p2", "title": "Performance Running Socks", "category": "Fitness", "tags": ["running", "comfort"]},
            {"id": "p3", "title": "Ceramic Coffee Mug", "category": "Home", "tags": ["kitchen", "ceramic"]},
            {"id": "p4", "title": "Yoga Mat", "category": "Fitness", "tags": ["yoga", "fitness"]},
        ],
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["strategy"] == "hybrid_tfidf_popularity"
    assert body["scope"] == "aggregate"
    assert body["weights"] == {"content": 0.75, "popularity": 0.25}
    assert len(body["recommendations"]) == 4


def test_recommend_respects_top_n_and_categories():
    payload = {
        "interactions": [{"user_id": "u1", "product_id": "p1", "quantity": 1}],
        "products": [
            {"id": "p1", "title": "Trail Running Shoes", "category": "Fitness", "tags": ["running"]},
            {"id": "p2", "title": "Running Socks", "category": "Fitness", "tags": ["running"]},
            {"id": "p3", "title": "Gym Gloves", "category": "Fitness", "tags": ["gym"]},
            {"id": "p4", "title": "Coffee Mug", "category": "Home", "tags": ["kitchen"]},
            {"id": "p5", "title": "Desk Light", "category": "Home", "tags": ["lighting"]},
        ],
        "user_id": "u1",
        "top_n": 3,
    }
    response = client.post("/recommend", json=payload)
    body = response.json()
    assert len(body["recommendations"]) <= 3
    categories = [item["product_id"] for item in body["recommendations"]]
    assert len(categories) == len(set(categories))


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
    body = response.json()
    assert len(body["forecast"]) == 2
    assert all(point["predicted_total"] == 100.0 for point in body["forecast"])
    assert body["model"] == "flat"


def test_forecast_detects_weekly_seasonality():
    start = date(2026, 1, 1)
    series = []
    for offset in range(28):
        day = start + timedelta(days=offset)
        total = 100 + offset * 5
        if day.weekday() >= 5:
            total *= 1.6
        series.append({"date": day.isoformat(), "total": total})

    response = client.post("/forecast", json={"sales_series": series, "horizon_days": 7})
    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "seasonal_trend"
    assert len(body["forecast"]) == 7
    assert all(point["predicted_total"] > 0 for point in body["forecast"])


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


def test_segment_auto_selects_clusters_and_labels():
    customers = [
        {"user_id": "u1", "order_value": 2400, "order_count": 18},
        {"user_id": "u2", "order_value": 2100, "order_count": 15},
        {"user_id": "u3", "order_value": 900, "order_count": 7},
        {"user_id": "u4", "order_value": 760, "order_count": 6},
        {"user_id": "u5", "order_value": 300, "order_count": 2},
        {"user_id": "u6", "order_value": 260, "order_count": 2},
        {"user_id": "u7", "order_value": 120, "order_count": 1},
        {"user_id": "u8", "order_value": 90, "order_count": 1},
    ]
    response = client.post("/segment", json={"customers": customers})
    assert response.status_code == 200
    body = response.json()
    assert 2 <= body["n_clusters"] <= 4
    assert len(body["segments"]) == len(customers)
    assert len(body["summary"]) == body["n_clusters"]
    assert all(segment["label"] for segment in body["segments"])
    assert all(entry["label"] for entry in body["summary"])
    assert abs(sum(entry["revenue_share"] for entry in body["summary"]) - 1.0) < 0.01
