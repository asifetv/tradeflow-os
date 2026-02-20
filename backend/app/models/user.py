"""User model - represents a user account in a company."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.company import Company


class User(Base):
    """User account entity (scoped to company)."""

    __tablename__ = "user"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())

    # Company Reference
    company_id: Mapped[UUID] = mapped_column(ForeignKey("company.id"), nullable=False, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user")  # admin, sales, procurement, finance, quality, logistics

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

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

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="users")

    __table_args__ = (
        # Email unique within company (support same email across different companies)
        Index("ix_user_email_company", "email", "company_id", unique=True),
        Index("ix_user_company_id", "company_id"),
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
