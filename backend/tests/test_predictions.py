"""Crop prediction + history tests (ensures ML features still work)."""

SAMPLE_INPUT = {
    "nitrogen": 90,
    "phosphorus": 42,
    "potassium": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.93,
}


def _auth_headers(client):
    client.post("/api/auth/register", json={
        "email": "predictor@agrosense.ai",
        "username": "predictor",
        "password": "PredictPass123",
        "full_name": "Predictor",
    })
    res = client.post("/api/auth/login", json={
        "email": "predictor@agrosense.ai",
        "password": "PredictPass123",
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_predict_anonymous(client):
    res = client.post("/api/predict", json=SAMPLE_INPUT)
    assert res.status_code == 200
    body = res.json()
    assert body["predicted_crop"]
    assert 0 <= body["confidence"] <= 100
    assert len(body["top_crops"]) >= 1


def test_predict_authenticated_and_history(client):
    headers = _auth_headers(client)

    res = client.post("/api/predict", json=SAMPLE_INPUT, headers=headers)
    assert res.status_code == 200

    res = client.get("/api/history", headers=headers)
    assert res.status_code == 200
    history = res.json()
    assert len(history) >= 1


def test_predict_invalid_input(client):
    res = client.post("/api/predict", json={**SAMPLE_INPUT, "ph": 99})
    assert res.status_code == 422


def test_model_info(client):
    res = client.get("/api/model-info")
    assert res.status_code == 200


def test_stats(client):
    res = client.get("/api/stats")
    assert res.status_code == 200
