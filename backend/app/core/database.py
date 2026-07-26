"""Database configuration and session management (SQLite dev / PostgreSQL prod)."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()


def _normalize_db_url(url: str) -> str:
    """
    Normalize DATABASE_URL to an async driver URL.
    Render/Heroku provide 'postgres://' or 'postgresql://' which must
    become 'postgresql+asyncpg://' for SQLAlchemy async.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


DATABASE_URL = _normalize_db_url(settings.DATABASE_URL)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create tables if they don't exist (Alembic manages production migrations)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
