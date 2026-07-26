"""Core configuration for AgroSense AI backend."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    SECRET_KEY: str = "agrosense-ai-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    # Dev default: SQLite. Production: postgresql+asyncpg://user:password@host/dbname
    DATABASE_URL: str = "sqlite+aiosqlite:///./agrosense.db"

    WEATHER_API_KEY: str = "demo"

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    # Comma-separated list of extra allowed CORS origins (production frontend URLs)
    CORS_ORIGINS: str = ""

    # Email verification
    # When True, users must verify their email before they can log in.
    REQUIRE_EMAIL_VERIFICATION: bool = False
    # EMAIL_MODE: console (log to stdout) | smtp (Gmail app password) | sendgrid
    EMAIL_MODE: str = "console"
    EMAIL_FROM: str = "AgroSense AI <no-reply@agrosense.ai>"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SENDGRID_API_KEY: str = ""

    # Google OAuth 2.0
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins(self) -> List[str]:
        """Build the full list of allowed CORS origins."""
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            self.FRONTEND_URL,
        ]
        if self.CORS_ORIGINS:
            origins.extend(o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip())
        # De-duplicate while preserving order
        return list(dict.fromkeys(origins))

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.BACKEND_URL}/api/auth/google/callback"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
