from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Connection pool tuning for a remote Postgres (Neon).
# pool_pre_ping is deliberately OFF: it adds a SELECT 1 before every checkout,
# which is ~300ms round-trip when the DB is in a different region. Instead we
# rely on pool_recycle to drop stale connections and let SQLAlchemy retry once
# on a stale-connection error.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=False,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,  # recycle connections after 30 min
    pool_timeout=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
