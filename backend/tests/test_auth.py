"""Authentication flow tests: register, verify, login, refresh, password reset."""

STRONG_PW = "FarmSecure123"
USER = {
    "email": "tester@agrosense.ai",
    "username": "tester",
    "password": STRONG_PW,
    "full_name": "Test User",
}


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_register_weak_password_rejected(client):
    # <8 chars fails Pydantic validation (422); the rest fail strength checks (400)
    for weak in ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere"]:
        res = client.post("/api/auth/register", json={**USER, "password": weak})
        assert res.status_code in (400, 422), weak


def test_register_success(client, captured_emails):
    res = client.post("/api/auth/register", json=USER)
    assert res.status_code == 200
    body = res.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["email"] == USER["email"]
    assert body["user"]["is_verified"] is False
    # Verification email token was generated and "sent"
    assert "verification_token" in captured_emails


def test_register_duplicate_email(client):
    res = client.post("/api/auth/register", json={**USER, "username": "other"})
    assert res.status_code == 400
    assert "Email already registered" in res.json()["detail"]


def test_verify_email(client, captured_emails):
    # Register a second user to get a fresh verification token
    res = client.post("/api/auth/register", json={
        "email": "verifyme@agrosense.ai",
        "username": "verifyme",
        "password": STRONG_PW,
        "full_name": "Verify Me",
    })
    assert res.status_code == 200
    token = captured_emails["verification_token"]

    res = client.get(f"/api/auth/verify-email/{token}")
    assert res.status_code == 200

    # Token is single-use
    res = client.get(f"/api/auth/verify-email/{token}")
    assert res.status_code == 400


def test_login_success(client):
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": STRONG_PW})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_login_wrong_password(client):
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": "WrongPass123"})
    assert res.status_code == 401


def test_refresh_token(client):
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": STRONG_PW})
    refresh = res.json()["refresh_token"]

    res = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert res.status_code == 200
    assert res.json()["access_token"]

    # Access token must not work as a refresh token
    access = res.json()["access_token"]
    res = client.post("/api/auth/refresh", json={"refresh_token": access})
    assert res.status_code == 401


def test_forgot_and_reset_password(client, captured_emails):
    res = client.post("/api/auth/forgot-password", json={"email": USER["email"]})
    assert res.status_code == 200
    token = captured_emails["reset_token"]

    # Weak new password rejected (422 = Pydantic min_length, 400 = strength check)
    res = client.post(f"/api/auth/reset-password/{token}", json={"password": "weak"})
    assert res.status_code in (400, 422)

    new_pw = "NewFarmPass456"
    res = client.post(f"/api/auth/reset-password/{token}", json={"password": new_pw})
    assert res.status_code == 200

    # Old password no longer works, new one does
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": STRONG_PW})
    assert res.status_code == 401
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": new_pw})
    assert res.status_code == 200


def test_forgot_password_unknown_email_no_leak(client):
    res = client.post("/api/auth/forgot-password", json={"email": "ghost@agrosense.ai"})
    assert res.status_code == 200  # anti-enumeration: always success


def test_login_rate_limit(client):
    for _ in range(10):
        client.post("/api/auth/login", json={"email": "rl@agrosense.ai", "password": "Whatever123"})
    res = client.post("/api/auth/login", json={"email": "rl@agrosense.ai", "password": "Whatever123"})
    assert res.status_code == 429


def test_profile_me(client):
    res = client.post("/api/auth/login", json={"email": USER["email"], "password": "NewFarmPass456"})
    token = res.json()["access_token"]

    res = client.get("/api/auth/me", params={"token": token})
    assert res.status_code == 200
    assert res.json()["username"] == USER["username"]
