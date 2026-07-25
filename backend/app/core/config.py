"""Core configuration for AgroSense AI backend."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    SECRET_KEY: str = "agrosense-ai-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite+aiosqlite:///./agrosense.db"
    WEATHER_API_KEY: str = "demo"
    FRONTEND_URL: str = "http://localhost:5173"
    # Comma-separated list of extra allowed CORS origins (production frontend URLs)
    CORS_ORIGINS: str = ""

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


@lru_cache()
def get_settings() -> Settings:
    return Settings()
