"""Customer model - core CRM entity for tracking customer companies and contacts."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List

from sqlalchemy import DateTime, String, Text, func, Index, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.database import Base

if TYPE_CHECKING:
    from app.models.deal import Deal
    from app.models.quote import Quote
    from app.models.customer_po import CustomerPO


class Customer(Base):
    """Customer company entity."""

    __tablename__ = "customer"

    # IDs
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())
    customer_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True, unique=True)

    # Company Details
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Primary Contact
    primary_contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primary_contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    primary_contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Business Terms
    payment_terms: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    credit_limit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Additional Details
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    deals: Mapped[List["Deal"]] = relationship(
        "Deal",
        foreign_keys="Deal.customer_id",
        primaryjoin="Customer.id == Deal.customer_id"
    )
    quotes: Mapped[List["Quote"]] = relationship(
        "Quote",
        foreign_keys="Quote.customer_id",
        primaryjoin="Customer.id == Quote.customer_id"
    )
    customer_pos: Mapped[List["CustomerPO"]] = relationship(
        "CustomerPO",
        foreign_keys="CustomerPO.customer_id",
        primaryjoin="Customer.id == CustomerPO.customer_id"
    )

    __table_args__ = (
        # Unique constraint on customer_code for active (non-deleted) customers only
        Index("ix_customer_code_active", "customer_code", "deleted_at",
              sqlite_where="deleted_at IS NULL", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Customer {self.customer_code} - {self.company_name}>"
