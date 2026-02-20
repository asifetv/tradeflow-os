"""Company model - tenant root entity for multi-tenancy."""
from sqlalchemy import String, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

from app.database import Base


class Company(Base):
    """Root tenant entity for complete company isolation."""

    __tablename__ = "companies"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Company Info
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    subdomain: Mapped[str] = mapped_column(String(50), nullable=False)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Subscription
    plan_tier: Mapped[str] = mapped_column(String(50), default="trial")  # trial, basic, professional, enterprise
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    __table_args__ = (
        Index("ix_companies_subdomain", "subdomain", unique=True),
        Index("ix_companies_created_at", "created_at"),
        Index("ix_companies_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Company {self.company_name} ({self.subdomain})>"
