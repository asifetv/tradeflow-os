"""CustomerPO request/response schemas."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.customer_po import CustomerPOStatus


class CustomerPOLineItemCreate(BaseModel):
    """Line item for customer PO creation."""
    description: str
    material_spec: Optional[str] = None
    quantity: float = Field(gt=0)
    unit: str
    unit_price: float = Field(ge=0)
    total_price: float = Field(ge=0)


class CustomerPOLineItemResponse(BaseModel):
    """Line item in response."""
    description: str
    material_spec: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    total_price: float


class CustomerPOCreate(BaseModel):
    """Schema for creating a customer PO."""
    internal_ref: Optional[str] = Field(None, min_length=1, max_length=50, description="Auto-generated if not provided")
    po_number: str = Field(..., min_length=1, max_length=100)
    customer_id: UUID
    deal_id: Optional[UUID] = None
    quote_id: Optional[UUID] = None
    line_items: List[CustomerPOLineItemCreate] = Field(default_factory=list)
    total_amount: float = Field(ge=0)
    currency: str = "AED"
    po_date: date
    delivery_date: Optional[date] = None
    notes: Optional[str] = None


class CustomerPOUpdate(BaseModel):
    """Schema for updating a customer PO (all fields optional)."""
    internal_ref: Optional[str] = Field(None, min_length=1, max_length=50)
    po_number: Optional[str] = Field(None, min_length=1, max_length=100)
    customer_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    quote_id: Optional[UUID] = None
    line_items: Optional[List[CustomerPOLineItemCreate]] = None
    total_amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    po_date: Optional[date] = None
    delivery_date: Optional[date] = None
    notes: Optional[str] = None


class CustomerPOStatusUpdate(BaseModel):
    """Schema for updating customer PO status."""
    status: CustomerPOStatus


class CustomerPOResponse(BaseModel):
    """CustomerPO response schema."""
    id: UUID
    internal_ref: str
    po_number: str
    customer_id: UUID
    deal_id: Optional[UUID] = None
    quote_id: Optional[UUID] = None
    status: CustomerPOStatus
    line_items: List[CustomerPOLineItemResponse] = Field(default_factory=list)
    total_amount: float
    currency: str
    po_date: date
    delivery_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerPOsListResponse(BaseModel):
    """Paginated list of customer POs."""
    customer_pos: List[CustomerPOResponse]
    total: int
    skip: int
    limit: int
