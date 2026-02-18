"""Quote model - formal price quotations linked to customers and deals."""
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING, List
import enum

from sqlalchemy import DateTime, Enum, String, Text, func, JSON, Index, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.customer_po import CustomerPO


class QuoteStatus(str, enum.Enum):
    """Valid quote status transitions."""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    REVISED = "revised"


class Quote(Base):
    """Quote (formal price quotation) entity."""

    __tablename__ = "quote"

    # IDs
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())
    quote_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True, unique=True)

    # References
    customer_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    deal_id: Mapped[Optional[UUID]] = mapped_column(nullable=True, index=True)

    # Status & Workflow
    status: Mapped[QuoteStatus] = mapped_column(
        Enum(QuoteStatus),
        default=QuoteStatus.DRAFT,
        nullable=False,
        index=True
    )

    # Quote Details
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Line Items (stored as JSON)
    line_items: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Array of {description, material_spec, quantity, unit, unit_price, total_price}"
    )

    # Financial
    total_amount: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="AED", nullable=False)

    # Terms
    payment_terms: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    delivery_terms: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    validity_days: Mapped[int] = mapped_column(default=30, nullable=False)

    # Dates
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Metadata
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
    customer: Mapped["Customer"] = relationship(
        "Customer",
        foreign_keys=[customer_id],
        primaryjoin="Quote.customer_id == Customer.id"
    )
    deal: Mapped[Optional["Deal"]] = relationship(
        "Deal",
        back_populates="quotes",
        foreign_keys=[deal_id],
        primaryjoin="Quote.deal_id == Deal.id"
    )
    customer_pos: Mapped[List["CustomerPO"]] = relationship(
        "CustomerPO",
        back_populates="quote",
        foreign_keys="CustomerPO.quote_id"
    )

    __table_args__ = (
        # Unique constraint on quote_number for active (non-deleted) quotes only
        Index("ix_quote_number_active", "quote_number", "deleted_at",
              sqlite_where="deleted_at IS NULL", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Quote {self.quote_number} - {self.status}>"
