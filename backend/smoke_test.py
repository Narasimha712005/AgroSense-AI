"""End-to-end smoke test for AgroSense AI backend (run against local server)."""
import httpx
import random
import sys

BASE = "http://127.0.0.1:8002"
suffix = random.randint(10000, 99999)
email = f"testuser{suffix}@example.com"
username = f"testuser{suffix}"
password = "TestPass123!"

results = []

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")

with httpx.Client(base_url=BASE, timeout=30) as c:
    # Health
    r = c.get("/health")
    check("Health check", r.status_code == 200, str(r.json()))

    # Register
    r = c.post("/api/auth/register", json={
        "email": email, "username": username,
        "password": password, "full_name": "Test User"})
    check("Registration", r.status_code == 200, f"status={r.status_code}")
    token = r.json().get("access_token", "") if r.status_code == 200 else ""

    # Login
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    check("Login", r.status_code == 200 and "access_token" in r.json(), f"status={r.status_code}")
    token = r.json().get("access_token", token)

    # JWT auth - /me
    r = c.get("/api/auth/me", params={"token": token})
    check("JWT auth (/me)", r.status_code == 200 and r.json().get("username") == username, f"status={r.status_code}")

    # Prediction (authenticated -> saved to history)
    r = c.post("/api/predict", json={
        "nitrogen": 90, "phosphorus": 42, "potassium": 43,
        "temperature": 20.87, "humidity": 82.0, "ph": 6.5, "rainfall": 202.93},
        headers={"Authorization": f"Bearer {token}"})
    ok = r.status_code == 200 and r.json().get("predicted_crop") == "rice"
    check("Crop prediction", ok, f"crop={r.json().get('predicted_crop')}, conf={r.json().get('confidence')}")

    # History
    r = c.get("/api/history", headers={"Authorization": f"Bearer {token}"})
    check("History page", r.status_code == 200 and len(r.json()) >= 1, f"items={len(r.json())}")

    # Weather
    r = c.get("/api/weather", params={"city": "Mumbai"})
    check("Weather API", r.status_code == 200 and "temperature" in r.json(), f"status={r.status_code}")

    # Stats (dashboard sliders)
    r = c.get("/api/stats")
    check("Feature stats (dashboard)", r.status_code == 200 and "N" in r.json(), f"status={r.status_code}")

    # Model info
    r = c.get("/api/model-info")
    check("Model info", r.status_code == 200 and r.json().get("n_classes") == 22, f"classes={r.json().get('n_classes')}")

failed = [n for n, ok, _ in results if not ok]
print()
print(f"TOTAL: {len(results)} tests, {len(results) - len(failed)} passed, {len(failed)} failed")
sys.exit(1 if failed else 0)
