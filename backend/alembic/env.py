"""Alembic environment - Async PostgreSQL support with asyncpg."""

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config


# Make backend app importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


from app.core.config import get_settings  # noqa
from app.core.database import Base  # noqa
from app.models import database_models  # noqa


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# -------------------------------
# Database URL FIX
# -------------------------------

settings = get_settings()

database_url = os.environ.get(
    "DATABASE_URL",
    settings.DATABASE_URL
)


# Render / Neon gives:
# postgresql://user:pass@host/db
#
# SQLAlchemy async requires:
# postgresql+asyncpg://user:pass@host/db

if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1
    )


config.set_main_option(
    "sqlalchemy.url",
    database_url
)


target_metadata = Base.metadata



# -------------------------------
# Offline Migration
# -------------------------------

def run_migrations_offline() -> None:

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )


    with context.begin_transaction():
        context.run_migrations()



# -------------------------------
# Online Migration
# -------------------------------

def do_run_migrations(
    connection: Connection
):

    context.configure(
        connection=connection,
        target_metadata=target_metadata
    )


    with context.begin_transaction():
        context.run_migrations()



async def run_async_migrations():

    connectable = async_engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )


    async with connectable.connect() as connection:

        await connection.run_sync(
            do_run_migrations
        )


    await connectable.dispose()



def run_migrations_online():

    asyncio.run(
        run_async_migrations()
    )



if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()