"""Alembic environment configuration."""
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
from app.database import Base
# Import models individually to control what gets registered
from app.models.deal import Deal  # noqa: F401
from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.quote import Quote  # noqa: F401
from app.models.customer_po import CustomerPO  # noqa: F401
from app.models.vendor import Vendor  # noqa: F401
from app.models.vendor_proposal import VendorProposal  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.user import User  # noqa: F401
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    from app.config import settings
    import os

    configuration = config.get_section(config.config_ini_section)

    # For SQLite with aiosqlite, convert to sync SQLite URL for migration
    database_url = settings.DATABASE_URL
    if "sqlite+aiosqlite" in database_url:
        # Convert aiosqlite:/// to sqlite:///
        # Handle both /:memory: and ./path/to/db.db
        database_url = database_url.replace("sqlite+aiosqlite:///", "sqlite:///")

        # For relative paths, convert to absolute path
        if database_url.startswith("sqlite:///./"):
            rel_path = database_url.replace("sqlite:///./", "")
            abs_path = os.path.abspath(rel_path)
            database_url = f"sqlite:///{abs_path}"

    configuration["sqlalchemy.url"] = database_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
