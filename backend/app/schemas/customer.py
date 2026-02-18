"""Customer request/response schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    """Schema for creating a customer."""
    customer_code: str = Field(..., min_length=1, max_length=50, description="Unique customer code")
    company_name: str = Field(..., min_length=1, max_length=200)
    country: str = Field(..., min_length=1, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    primary_contact_name: Optional[str] = Field(None, max_length=200)
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = Field(None, max_length=50)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)
    is_active: bool = True
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Schema for updating a customer (all fields optional)."""
    customer_code: Optional[str] = Field(None, min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    primary_contact_name: Optional[str] = Field(None, max_length=200)
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = Field(None, max_length=50)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    """Customer response schema."""
    id: UUID
    customer_code: str
    company_name: str
    country: str
    city: Optional[str] = None
    address: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CustomersListResponse(BaseModel):
    """Paginated list of customers."""
    customers: List[CustomerResponse]
    total: int
    skip: int
    limit: int
