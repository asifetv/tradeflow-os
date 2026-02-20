"""Pydantic schemas for vendor proposals."""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List, Literal


class VendorBaseResponse(BaseModel):
    """Simplified vendor info for proposal responses."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vendor_code: str
    company_name: str
    country: str
    credibility_score: int
    on_time_delivery_rate: Optional[float]
    quality_score: Optional[int]
    avg_lead_time_days: Optional[int]
    primary_contact_name: Optional[str]
    primary_contact_email: Optional[str]
    primary_contact_phone: Optional[str]
    is_active: bool


class VendorProposalCreate(BaseModel):
    """Schema for creating a vendor proposal."""
    vendor_id: UUID
    deal_id: UUID
    total_price: Optional[float] = None
    currency: str = "AED"
    lead_time_days: Optional[int] = None
    payment_terms: Optional[str] = None
    validity_date: Optional[date] = None
    specs_match: Optional[bool] = None
    discrepancies: Optional[dict] = None
    notes: Optional[str] = None
    raw_document_url: Optional[str] = None
    parsed_data: Optional[dict] = None


class VendorProposalUpdate(BaseModel):
    """Schema for updating a vendor proposal."""
    total_price: Optional[float] = None
    currency: Optional[str] = None
    lead_time_days: Optional[int] = None
    payment_terms: Optional[str] = None
    validity_date: Optional[date] = None
    specs_match: Optional[bool] = None
    discrepancies: Optional[dict] = None
    notes: Optional[str] = None
    status: Optional[Literal["requested", "received", "selected", "rejected"]] = None


class VendorProposalResponse(BaseModel):
    """Schema for vendor proposal response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    deal_id: UUID
    vendor_id: UUID
    vendor: Optional[VendorBaseResponse] = None
    status: str
    total_price: Optional[float]
    currency: str
    lead_time_days: Optional[int]
    payment_terms: Optional[str]
    validity_date: Optional[date]
    specs_match: Optional[bool]
    discrepancies: Optional[dict]
    notes: Optional[str]
    raw_document_url: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProposalComparisonItem(BaseModel):
    """Single vendor proposal in comparison view."""
    id: UUID
    vendor_id: UUID
    vendor_name: str
    vendor_credibility: int
    total_price: Optional[float]
    lead_time_days: Optional[int]
    specs_match: Optional[bool]
    discrepancies: Optional[dict]
    status: str
    is_best_price: bool
    is_worst_price: bool
    is_best_lead_time: bool


class ProposalComparisonResponse(BaseModel):
    """Hero feature: side-by-side proposal comparison dashboard."""
    deal_id: UUID
    proposals: List[ProposalComparisonItem]
    best_price: Optional[float]
    worst_price: Optional[float]
    best_lead_time: Optional[int]
    worst_lead_time: Optional[int]


class VendorProposalListResponse(BaseModel):
    """Schema for vendor proposal list response."""
    total: int
    items: List[VendorProposalResponse]
