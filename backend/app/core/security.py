"""Security utilities: password hashing, JWT tokens, password validation, rate limiting."""
import re
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================
# PASSWORD HASHING
# ============================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ============================================================
# PASSWORD STRENGTH VALIDATION
# ============================================================

def validate_password_strength(password: str) -> Optional[str]:
    """Return an error message if the password is weak, else None."""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one number"
    return None


# ============================================================
# JWT TOKENS (access + refresh)
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode an access token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Backwards compatible: old tokens have no "type" claim
        if payload.get("type") not in (None, "access"):
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode a refresh token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


# ============================================================
# SECURE RANDOM TOKENS (email verification / password reset)
# ============================================================

def generate_secure_token() -> str:
    return secrets.token_urlsafe(48)


def generate_otp() -> str:
    """Generate a cryptographically secure random 6-digit OTP, e.g. "483921"."""
    return f"{secrets.randbelow(1_000_000):06d}"


# ============================================================
# SIMPLE IN-MEMORY RATE LIMITER
# ============================================================

_rate_buckets: dict = defaultdict(list)


def rate_limit(request: Request, key: str, max_requests: int = 10, window_seconds: int = 60) -> None:
    """
    Sliding-window in-memory rate limiter.
    Raises HTTP 429 when the client exceeds max_requests within window_seconds.
    """
    client_ip = request.client.host if request.client else "unknown"
    bucket_key = f"{key}:{client_ip}"
    now = time.time()

    bucket = _rate_buckets[bucket_key]
    # Drop entries outside the window
    _rate_buckets[bucket_key] = bucket = [t for t in bucket if now - t < window_seconds]

    if len(bucket) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    bucket.append(now)
