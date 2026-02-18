"""Database connection and session management."""
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

# Create async engine with database-specific parameters
# SQLite doesn't support pool_size, max_overflow, etc.
engine_kwargs = {
    "echo": settings.APP_DEBUG,
    "pool_pre_ping": True,
}

# Only add pool parameters for PostgreSQL
if "postgresql" in settings.DATABASE_URL:
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_recycle": settings.DATABASE_POOL_RECYCLE,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for all models
Base = declarative_base()


async def get_db():
    """Dependency: get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
