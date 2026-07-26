"""Core configuration for AgroSense AI backend."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Security
    SECRET_KEY: str = "agrosense-ai-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30


    # -----------------------------
    # Database
    # -----------------------------

    # Development:
    # sqlite+aiosqlite:///./agrosense.db
    #
    # Production:
    # postgresql+asyncpg://user:password@host/dbname

    DATABASE_URL: str = "sqlite+aiosqlite:///./agrosense.db"



    # -----------------------------
    # Weather API
    # -----------------------------

    WEATHER_API_KEY: str = "demo"



    # -----------------------------
    # Frontend / Backend URLs
    # -----------------------------

    FRONTEND_URL: str = "http://localhost:5173"

    BACKEND_URL: str = "http://localhost:8000"


    # Extra CORS origins
    # Example:
    # https://agro-sense-ai-eta.vercel.app

    CORS_ORIGINS: str = ""



    # -----------------------------
    # Email Verification
    # -----------------------------

    # Users must verify email before login

    REQUIRE_EMAIL_VERIFICATION: bool = True



    # Email provider
    #
    # Available:
    # console
    # smtp
    # sendgrid
    # resend

    EMAIL_MODE: str = "resend"



    # Resend sender email
    #
    # For testing use:
    # onboarding@resend.dev
    #
    # Later after domain verification:
    # no-reply@yourdomain.com

    EMAIL_FROM: str = "onboarding@resend.dev"



    # Resend API Key

    RESEND_API_KEY: str = ""



    # -----------------------------
    # SMTP Settings
    # -----------------------------

    SMTP_HOST: str = "smtp.gmail.com"

    SMTP_PORT: int = 587

    SMTP_USER: str = ""

    SMTP_PASSWORD: str = ""



    # -----------------------------
    # SendGrid Settings
    # -----------------------------

    SENDGRID_API_KEY: str = ""



    # -----------------------------
    # Google OAuth
    # -----------------------------

    GOOGLE_CLIENT_ID: str = ""

    GOOGLE_CLIENT_SECRET: str = ""



    class Config:

        env_file = ".env"

        extra = "ignore"



    @property
    def cors_origins(self) -> List[str]:
        """
        Build the full list of allowed CORS origins.
        """

        origins = [

            "http://localhost:5173",

            "http://localhost:3000",

            self.FRONTEND_URL,

        ]


        if self.CORS_ORIGINS:

            origins.extend(

                o.strip()

                for o in self.CORS_ORIGINS.split(",")

                if o.strip()

            )


        # Remove duplicates

        return list(dict.fromkeys(origins))



    @property
    def google_redirect_uri(self) -> str:

        return f"{self.BACKEND_URL}/api/auth/google/callback"




@lru_cache()
def get_settings() -> Settings:

    return Settings()