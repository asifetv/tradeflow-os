"""CustomerPO model - purchase orders received from customers."""
from datetime import date, datetime
from typing import Optional
import enum

from sqlalchemy import DateTime, Enum, String, Text, func, JSON, Index, Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID

from app.database import Base


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
    company_id: Mapped[UUID] = mapped_column(ForeignKey("company.id"), nullable=False, index=True)
    internal_ref: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
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


    __table_args__ = (
        # Internal ref unique per company
        Index("ix_internal_ref_company", "internal_ref", "company_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<CustomerPO {self.internal_ref} - {self.status}>"
