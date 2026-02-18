"""Quote request/response schemas."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.quote import QuoteStatus


class QuoteLineItemCreate(BaseModel):
    """Line item for quote creation."""
    description: str
    material_spec: Optional[str] = None
    quantity: float = Field(gt=0)
    unit: str
    unit_price: float = Field(ge=0)
    total_price: float = Field(ge=0)


class QuoteLineItemResponse(BaseModel):
    """Line item in response."""
    description: str
    material_spec: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    total_price: float


class QuoteCreate(BaseModel):
    """Schema for creating a quote."""
    quote_number: str = Field(..., min_length=1, max_length=50)
    customer_id: UUID
    deal_id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    line_items: List[QuoteLineItemCreate] = Field(default_factory=list)
    total_amount: float = Field(ge=0)
    currency: str = "AED"
    payment_terms: Optional[str] = Field(None, max_length=200)
    delivery_terms: Optional[str] = Field(None, max_length=200)
    validity_days: int = 30
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    """Schema for updating a quote (all fields optional)."""
    quote_number: Optional[str] = Field(None, min_length=1, max_length=50)
    customer_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    line_items: Optional[List[QuoteLineItemCreate]] = None
    total_amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    payment_terms: Optional[str] = Field(None, max_length=200)
    delivery_terms: Optional[str] = Field(None, max_length=200)
    validity_days: Optional[int] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class QuoteStatusUpdate(BaseModel):
    """Schema for updating quote status."""
    status: QuoteStatus


class QuoteResponse(BaseModel):
    """Quote response schema."""
    id: UUID
    quote_number: str
    customer_id: UUID
    deal_id: Optional[UUID] = None
    status: QuoteStatus
    title: str
    description: Optional[str] = None
    line_items: List[QuoteLineItemResponse] = Field(default_factory=list)
    total_amount: float
    currency: str
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    validity_days: int
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QuotesListResponse(BaseModel):
    """Paginated list of quotes."""
    quotes: List[QuoteResponse]
    total: int
    skip: int
    limit: int
