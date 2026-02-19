"""Deal request/response schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.deal import DealStatus


class LineItemCreate(BaseModel):
    """Line item for deal creation."""
    description: str
    material_spec: str
    quantity: float
    unit: str
    unit_price: Optional[float] = None
    unit_total: Optional[float] = None
    required_delivery_date: str


class LineItemResponse(BaseModel):
    """Line item in response."""
    description: str
    material_spec: str
    quantity: float
    unit: str
    unit_price: Optional[float] = None
    unit_total: Optional[float] = None
    required_delivery_date: str


class DealCreate(BaseModel):
    """Schema for creating a deal."""
    deal_number: Optional[str] = Field(None, description="Auto-generated if not provided")
    customer_id: Optional[UUID] = None
    customer_rfq_ref: Optional[str] = None
    description: str
    currency: str = "AED"
    line_items: List[LineItemCreate] = Field(default_factory=list)
    total_value: Optional[float] = None
    total_cost: Optional[float] = None
    estimated_margin_pct: Optional[float] = None
    notes: Optional[str] = None


class DealUpdate(BaseModel):
    """Schema for updating a deal (all fields optional)."""
    deal_number: Optional[str] = None
    customer_id: Optional[UUID] = None
    customer_rfq_ref: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    line_items: Optional[List[LineItemCreate]] = None
    total_value: Optional[float] = None
    total_cost: Optional[float] = None
    estimated_margin_pct: Optional[float] = None
    notes: Optional[str] = None


class DealStatusUpdate(BaseModel):
    """Schema for updating deal status."""
    status: DealStatus


class DealResponse(BaseModel):
    """Deal response schema."""
    id: UUID
    deal_number: str
    status: DealStatus
    customer_id: Optional[UUID] = None
    customer_rfq_ref: Optional[str] = None
    description: str
    currency: str
    line_items: List[LineItemResponse] = Field(default_factory=list)
    total_value: Optional[float] = None
    total_cost: Optional[float] = None
    estimated_margin_pct: Optional[float] = None
    actual_margin_pct: Optional[float] = None
    notes: Optional[str] = None
    created_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DealListResponse(BaseModel):
    """Paginated list of deals."""
    deals: List[DealResponse]
    total: int
    skip: int
    limit: int
