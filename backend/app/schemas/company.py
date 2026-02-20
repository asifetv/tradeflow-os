"""Company schemas for request/response validation."""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class CompanyCreate(BaseModel):
    """Schema for company creation."""
    company_name: str = Field(..., min_length=1, max_length=200)
    subdomain: str = Field(..., min_length=3, max_length=50, pattern="^[a-z0-9-]+$")
    country: Optional[str] = Field(None, max_length=100)


class CompanyResponse(BaseModel):
    """Schema for company response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_name: str
    subdomain: str
    country: Optional[str]
    plan_tier: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
