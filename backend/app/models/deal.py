"""Deal model - the central entity of TradeFlow OS."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, String, Text, func, JSON, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
import enum
from uuid import UUID

from app.database import Base


class DealStatus(str, enum.Enum):
    """Valid deal status transitions."""
    RFQ_RECEIVED = "rfq_received"
    SOURCING = "sourcing"
    QUOTED = "quoted"
    PO_RECEIVED = "po_received"
    ORDERED = "ordered"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    INVOICED = "invoiced"
    PAID = "paid"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class Deal(Base):
    """Core deal entity."""

    __tablename__ = "deal"

    # IDs
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())
    deal_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Status & Workflow
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus),
        default=DealStatus.RFQ_RECEIVED,
        nullable=False,
        index=True
    )

    # Customer
    customer_id: Mapped[Optional[UUID]] = mapped_column(nullable=True, index=True)
    customer_rfq_ref: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Deal Details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="AED", nullable=False)

    # Line Items (stored as JSON)
    line_items: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Array of {description, material_spec, quantity, unit, required_delivery_date}"
    )

    # Financial
    total_value: Mapped[Optional[float]] = mapped_column(nullable=True)
    total_cost: Mapped[Optional[float]] = mapped_column(nullable=True)
    estimated_margin_pct: Mapped[Optional[float]] = mapped_column(nullable=True)
    actual_margin_pct: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Metadata
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[Optional[UUID]] = mapped_column(nullable=True)

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
        # Index on deal_number for unique lookups
        Index("ix_deal_number", "deal_number", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Deal {self.deal_number} - {self.status}>"
