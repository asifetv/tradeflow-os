"""Document request/response schemas."""
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.document import DocumentCategory, DocumentStatus


class DocumentCreate(BaseModel):
    """Schema for uploading a document."""

    category: DocumentCategory
    entity_type: Optional[str] = Field(
        None, description="Entity type (Deal, Quote, Vendor, etc.) or null for company docs"
    )
    entity_id: Optional[UUID] = Field(None, description="Entity ID or null for company docs")
    description: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = Field(default_factory=list)


class DocumentResponse(BaseModel):
    """Full document response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    category: DocumentCategory
    storage_bucket: str
    storage_key: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    extracted_text: Optional[str] = Field(None, description="Raw extracted text (may be large)")
    parsed_data: Optional[dict[str, Any]] = Field(None, description="AI-extracted structured data")
    status: DocumentStatus
    ai_confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    error_message: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class DocumentResponseWithoutText(BaseModel):
    """Document response without extracted_text (for lists)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    category: DocumentCategory
    original_filename: str
    file_size_bytes: int
    mime_type: str
    parsed_data: Optional[dict[str, Any]] = None
    status: DocumentStatus
    ai_confidence_score: Optional[float] = None
    error_message: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""

    items: List[DocumentResponseWithoutText]
    total: int
    skip: int
    limit: int


class DocumentDownloadUrlResponse(BaseModel):
    """Response with presigned download URL."""

    url: str
    expires_in_minutes: int = 60
    filename: str
