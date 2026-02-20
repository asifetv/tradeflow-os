"""Vendor model for M3 Procurement module."""
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List, TYPE_CHECKING
from app.database import Base

if TYPE_CHECKING:
    from app.models.vendor_proposal import VendorProposal


class Vendor(Base):
    __tablename__ = "vendors"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Company Reference (multi-tenant)
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)

    # Vendor Info
    vendor_code: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)

    # Capabilities
    certifications: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # ["ISO 9001", "API 5L"]
    product_categories: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # ["Pipes", "Valves"]

    # Performance Metrics
    credibility_score: Mapped[int] = mapped_column(Integer, default=50)  # 0-100
    on_time_delivery_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0-1.0
    quality_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-100
    avg_lead_time_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Contact
    primary_contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primary_contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    primary_contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Payment
    payment_terms: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bank_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(default=True)
    notes: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    proposals: Mapped[List["VendorProposal"]] = relationship("VendorProposal", back_populates="vendor", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_vendor_code_company", "vendor_code", "company_id", unique=True),
        Index("ix_vendors_company_name", "company_name"),
        Index("ix_vendors_credibility_score", "credibility_score"),
    )
