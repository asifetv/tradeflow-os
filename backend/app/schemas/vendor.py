"""Pydantic schemas for vendor management."""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List


class VendorCreate(BaseModel):
    """Schema for creating a vendor."""
    vendor_code: Optional[str] = Field(None, min_length=1, max_length=50)
    company_name: str = Field(..., min_length=1, max_length=200)
    country: str = Field(..., min_length=1, max_length=100)
    certifications: Optional[List[str]] = None
    product_categories: Optional[List[str]] = None
    credibility_score: Optional[int] = Field(50, ge=0, le=100)
    on_time_delivery_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    quality_score: Optional[int] = Field(None, ge=0, le=100)
    avg_lead_time_days: Optional[int] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class VendorUpdate(BaseModel):
    """Schema for updating a vendor."""
    vendor_code: Optional[str] = Field(None, min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    certifications: Optional[List[str]] = None
    product_categories: Optional[List[str]] = None
    credibility_score: Optional[int] = Field(None, ge=0, le=100)
    on_time_delivery_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    quality_score: Optional[int] = Field(None, ge=0, le=100)
    avg_lead_time_days: Optional[int] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class VendorResponse(BaseModel):
    """Schema for vendor response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    vendor_code: str
    company_name: str
    country: str
    certifications: Optional[List[str]]
    product_categories: Optional[List[str]]
    credibility_score: int
    on_time_delivery_rate: Optional[float]
    quality_score: Optional[int]
    avg_lead_time_days: Optional[int]
    primary_contact_name: Optional[str]
    primary_contact_email: Optional[str]
    primary_contact_phone: Optional[str]
    payment_terms: Optional[str]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class VendorListResponse(BaseModel):
    """Schema for vendor list response."""
    total: int
    items: List[VendorResponse]
