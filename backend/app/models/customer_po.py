"""CustomerPO model - purchase orders received from customers."""
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING
import enum

from sqlalchemy import DateTime, Enum, String, Text, func, JSON, Index, Date, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.quote import Quote


class CustomerPOStatus(str, enum.Enum):
    """Valid customer PO status transitions."""
    RECEIVED = "received"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class CustomerPO(Base):
    """Customer Purchase Order (CustomerPO) entity."""

    __tablename__ = "customer_po"

    # IDs
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())
    internal_ref: Mapped[str] = mapped_column(String(50), nullable=False, index=True, unique=True)
    po_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # References
    customer_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    deal_id: Mapped[Optional[UUID]] = mapped_column(nullable=True, index=True)
    quote_id: Mapped[Optional[UUID]] = mapped_column(nullable=True, index=True)

    # Status & Workflow
    status: Mapped[CustomerPOStatus] = mapped_column(
        Enum(CustomerPOStatus),
        default=CustomerPOStatus.RECEIVED,
        nullable=False,
        index=True
    )

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

    # Dates
    po_date: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

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
        primaryjoin="CustomerPO.customer_id == Customer.id"
    )
    deal: Mapped[Optional["Deal"]] = relationship(
        "Deal",
        back_populates="customer_pos",
        foreign_keys=[deal_id],
        primaryjoin="CustomerPO.deal_id == Deal.id"
    )
    quote: Mapped[Optional["Quote"]] = relationship(
        "Quote",
        back_populates="customer_pos",
        foreign_keys=[quote_id],
        primaryjoin="CustomerPO.quote_id == Quote.id"
    )

    __table_args__ = (
        # Unique constraint on internal_ref for active (non-deleted) POs only
        Index("ix_internal_ref_active", "internal_ref", "deleted_at",
              sqlite_where="deleted_at IS NULL", unique=True),
    )

    def __repr__(self) -> str:
        return f"<CustomerPO {self.internal_ref} - {self.status}>"
