"""User model - application user within a company."""
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

from app.database import Base


class User(Base):
    """Application user tied to a specific company."""

    __tablename__ = "users"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Company Reference
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user")  # admin, sales, procurement, finance, quality, logistics

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

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

    __table_args__ = (
        # Email globally unique (each email belongs to one person)
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
