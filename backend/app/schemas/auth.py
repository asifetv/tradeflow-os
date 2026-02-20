"""Authentication schemas for request/response validation."""
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """Schema for user registration request."""
    company_name: str
    subdomain: str
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict
    company: dict
