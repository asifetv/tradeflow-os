"""Company model - represents a SaaS customer account."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, Boolean, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Company(Base):
    """Company/tenant entity for multi-tenant SaaS."""

    __tablename__ = "company"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())

    # Company Info
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    subdomain: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(100))

    # Subscription
    plan_tier: Mapped[str] = mapped_column(String(50), default="trial")  # trial, basic, professional, enterprise
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_company_subdomain", "subdomain", unique=True),
        Index("ix_company_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Company {self.company_name} ({self.subdomain})>"
