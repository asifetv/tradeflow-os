"""Vendor proposal model for M3 Procurement module."""
from sqlalchemy import String, Numeric, Integer, Date, DateTime, ForeignKey, Index, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import Optional, TYPE_CHECKING
from enum import Enum
from app.database import Base

if TYPE_CHECKING:
    from app.models.vendor import Vendor
    from app.models.deal import Deal


class VendorProposalStatus(str, Enum):
    """Status of vendor proposal in the evaluation process."""
    REQUESTED = "requested"
    RECEIVED = "received"
    SELECTED = "selected"
    REJECTED = "rejected"


class VendorProposal(Base):
    __tablename__ = "vendor_proposals"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Company Reference
    company_id: Mapped[UUID] = mapped_column(ForeignKey("company.id"), nullable=False, index=True)

    # Relationships
    deal_id: Mapped[UUID] = mapped_column(ForeignKey("deal.id"), nullable=False, index=True)
    vendor_id: Mapped[UUID] = mapped_column(ForeignKey("vendors.id"), nullable=False, index=True)

    # Status
    status: Mapped[VendorProposalStatus] = mapped_column(
        SQLEnum(VendorProposalStatus, name="vendor_proposal_status"),
        nullable=False,
        default=VendorProposalStatus.REQUESTED,
        index=True,
    )

    # Pricing
    line_items: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    total_price: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="AED")

    # Terms
    lead_time_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    validity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Evaluation
    specs_match: Mapped[Optional[bool]] = mapped_column(nullable=True)
    discrepancies: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)

    # Document
    raw_document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    parsed_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    vendor: Mapped["Vendor"] = relationship("Vendor", back_populates="proposals")
    deal: Mapped["Deal"] = relationship("Deal", back_populates="vendor_proposals")

    __table_args__ = ()
