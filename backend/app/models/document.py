"""Document management model for M4 AI Document Management."""
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index, JSON, Enum as SQLEnum, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional
from enum import Enum
from app.database import Base


class DocumentCategory(str, Enum):
    """Category of document - drives AI extraction strategy."""
    RFQ = "rfq"
    VENDOR_PROPOSAL = "vendor_proposal"
    CERTIFICATE = "certificate"
    MATERIAL_CERTIFICATE = "material_certificate"
    SPEC_SHEET = "spec_sheet"
    INVOICE = "invoice"
    PACKING_LIST = "packing_list"
    TEST_REPORT = "test_report"
    COMPANY_POLICY = "company_policy"
    TEMPLATE = "template"
    OTHER = "other"


class DocumentStatus(str, Enum):
    """Status of document processing."""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    """Polymorphic document model - attaches to any entity or company."""

    __tablename__ = "documents"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Company Reference (always required)
    company_id: Mapped[UUID] = mapped_column(ForeignKey("company.id"), nullable=False, index=True)

    # Polymorphic Entity Reference (both null = company document)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    entity_id: Mapped[Optional[UUID]] = mapped_column(nullable=True, index=True)

    # Document Classification
    category: Mapped[DocumentCategory] = mapped_column(
        SQLEnum(DocumentCategory, name="document_category"),
        nullable=False,
        index=True,
        default=DocumentCategory.OTHER,
    )

    # Storage Location
    storage_bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)

    # File Metadata
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Document Content
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsed_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Processing Status
    status: Mapped[DocumentStatus] = mapped_column(
        SQLEnum(DocumentStatus, name="document_status"),
        nullable=False,
        default=DocumentStatus.UPLOADING,
        index=True,
    )
    ai_confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # User-Provided Metadata
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        # Index for entity lookups (for documents attached to entities)
        Index("ix_document_entity", "entity_type", "entity_id"),
        # Index for company docs (entity_type IS NULL)
        Index("ix_document_company_only", "company_id", "deleted_at"),
        # Index for listing by category
        Index("ix_document_category_company", "category", "company_id", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<Document {self.original_filename} - {self.status}>"
