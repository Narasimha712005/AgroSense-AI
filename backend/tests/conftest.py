"""Pytest configuration - isolated test database + captured emails."""
import os
import sys
from pathlib import Path

# Use an isolated SQLite DB for tests (set BEFORE the app is imported)
TEST_DB = "test_agrosense.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///./{TEST_DB}"
os.environ["REQUIRE_EMAIL_VERIFICATION"] = "False"
os.environ["EMAIL_MODE"] = "console"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from app.core import security
from main import app


@pytest.fixture(scope="session")
def client():
    """TestClient with lifespan (DB init + model load). Cleans up the test DB."""
    db_path = Path(__file__).resolve().parent.parent / TEST_DB
    if db_path.exists():
        db_path.unlink()

    with TestClient(app) as c:
        yield c

    if db_path.exists():
        db_path.unlink()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Keep tests independent of the login/register rate limits."""
    security._rate_buckets.clear()
    yield
    security._rate_buckets.clear()


@pytest.fixture
def captured_emails(monkeypatch):
    """Capture verification/reset tokens instead of sending real emails."""
    captured = {}

    def fake_verification(to, username, token):
        captured["verification_token"] = token

    def fake_reset(to, username, token):
        captured["reset_token"] = token

    import app.routers.auth as auth_router
    monkeypatch.setattr(auth_router, "send_verification_email", fake_verification)
    monkeypatch.setattr(auth_router, "send_password_reset_email", fake_reset)
    return captured
