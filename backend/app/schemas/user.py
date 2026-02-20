"""User schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


class UserCreate(BaseModel):
    """Schema for user creation."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=200)
    role: str = "user"


class UserResponse(BaseModel):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    email_verified: bool
    last_login_at: Optional[datetime]
    created_at: datetime
