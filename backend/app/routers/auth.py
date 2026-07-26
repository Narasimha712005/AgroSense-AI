"""Authentication router: register, login, email OTP verification, password reset,
Google OAuth, token refresh, and profile."""
import logging
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_otp,
    generate_secure_token,
    get_password_hash,
    rate_limit,
    validate_password_strength,
    verify_password,
)
from app.models.database_models import User
from app.models.schemas import (
    ForgotPasswordRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyOTPRequest,
)
from app.services.email_service import send_password_reset_email, send_verification_otp_email

logger = logging.getLogger("agrosense.auth")
settings = get_settings()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

OTP_EXPIRE_MINUTES = 10


def _issue_tokens(user: User) -> TokenResponse:
    """Create access + refresh tokens for a user."""
    return TokenResponse(
        access_token=create_access_token(data={"sub": str(user.id)}),
        refresh_token=create_refresh_token(data={"sub": str(user.id)}),
        user=UserResponse.model_validate(user),
    )


async def get_current_user(token: str = None, db: AsyncSession = Depends(get_db)) -> User:
    """Dependency to get current authenticated user."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# ============================================================
# REGISTER + EMAIL OTP VERIFICATION
# ============================================================

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user and send a 6-digit verification OTP by email."""
    rate_limit(request, "register", max_requests=10, window_seconds=60)

    # Password strength validation
    error = validate_password_strength(data.password)
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Check existing email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check existing username
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user (unverified) with a short-lived verification OTP
    otp = generate_otp()
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name or "",
        is_verified=False,
        verification_otp=otp,
        verification_otp_expires=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
        auth_provider="local",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

   # Send OTP email
email_sent = send_verification_otp_email(
    user.email,
    user.username,
    otp
)

if not email_sent:
    logger.error("OTP email failed to send for %s", user.email)

return _issue_tokens(user)


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(data: VerifyOTPRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Verify a user's email with the 6-digit OTP sent by email."""
    rate_limit(request, "verify-otp", max_requests=10, window_seconds=60)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return MessageResponse(message="Email verified successfully")

    if not user.verification_otp or not secrets.compare_digest(user.verification_otp, data.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if not user.verification_otp_expires or user.verification_otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    user.is_verified = True
    user.verification_otp = None
    user.verification_otp_expires = None
    user.verification_token = None
    await db.commit()

    logger.info("Email verified via OTP for user %s", user.username)
    return MessageResponse(message="Email verified successfully")


@router.get("/verify-email/{token}", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Legacy: verify a user's email using the token from an old verification link."""
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user.is_verified = True
    user.verification_token = None
    user.verification_otp = None
    user.verification_otp_expires = None
    await db.commit()

    logger.info("Email verified for user %s", user.username)
    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(data: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Generate and send a fresh verification OTP."""
    rate_limit(request, "resend-verification", max_requests=3, window_seconds=300)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and not user.is_verified:
        otp = generate_otp()
        user.verification_otp = otp
        user.verification_otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
        await db.commit()
        send_verification_otp_email(user.email, user.username, otp)

    # Always return success (don't leak which emails exist)
    return MessageResponse(message="If the email exists, a verification OTP has been sent.")


# ============================================================
# LOGIN + REFRESH
# ============================================================

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    """Login with email and password. Rate limited."""
    rate_limit(request, "login", max_requests=10, window_seconds=60)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in. Check your inbox."
        )

    return _issue_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    payload = decode_refresh_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return _issue_tokens(user)


# ============================================================
# FORGOT / RESET PASSWORD
# ============================================================

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Send a password reset email with a secure, expiring token."""
    rate_limit(request, "forgot-password", max_requests=5, window_seconds=300)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user:
        user.reset_token = generate_secure_token()
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        await db.commit()
        send_password_reset_email(user.email, user.username, user.reset_token)

    # Always return success (don't leak which emails exist)
    return MessageResponse(message="If the email exists, a reset link has been sent.")


@router.post("/reset-password/{token}", response_model=MessageResponse)
async def reset_password(token: str, data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset the password using a valid, non-expired reset token."""
    error = validate_password_strength(data.password)
    if error:
        raise HTTPException(status_code=400, detail=error)

    result = await db.execute(select(User).where(User.reset_token == token))
    user = result.scalar_one_or_none()

    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(data.password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    logger.info("Password reset for user %s", user.username)
    return MessageResponse(message="Password reset successfully. You can now log in.")


# ============================================================
# GOOGLE OAUTH 2.0
# ============================================================

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google/login")
async def google_login():
    """Redirect the user to Google's OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google login is not configured")

    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None, db: AsyncSession = Depends(get_db)):
    """Handle Google's OAuth callback: exchange code, create/link user, redirect to frontend."""
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_auth_failed")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google login is not configured")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            # Exchange authorization code for tokens
            token_resp = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            })
            token_resp.raise_for_status()
            google_access_token = token_resp.json()["access_token"]

            # Fetch user info
            info_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {google_access_token}"},
            )
            info_resp.raise_for_status()
            info = info_resp.json()
    except Exception as e:
        logger.error("Google OAuth failed: %s", e)
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_auth_failed")

    google_id = info["id"]
    email = info.get("email", "")
    name = info.get("name", "")

    # Find by google_id, then link by email, else create new user
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user and email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link Google account with existing email account
            user.google_id = google_id
            user.is_verified = True

    if not user:
        # Auto-create user on first Google login
        base_username = (email.split("@")[0] if email else f"google_{google_id[:8]}").lower()
        username = base_username
        i = 1
        while True:
            result = await db.execute(select(User).where(User.username == username))
            if not result.scalar_one_or_none():
                break
            username = f"{base_username}{i}"
            i += 1

        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(generate_secure_token()),
            full_name=name,
            is_verified=True,  # Google emails are pre-verified
            google_id=google_id,
            auth_provider="google",
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    access = create_access_token(data={"sub": str(user.id)})
    refresh = create_refresh_token(data={"sub": str(user.id)})
    # Deliver tokens to the frontend callback page
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?access_token={access}&refresh_token={refresh}"
    )


# ============================================================
# PROFILE
# ============================================================

@router.get("/me", response_model=UserResponse)
async def get_profile(token: str = "", db: AsyncSession = Depends(get_db)):
    """Get current user profile."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse.model_validate(user)
