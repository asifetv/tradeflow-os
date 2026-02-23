"""Document service - orchestrates storage, parsing, and AI extraction."""
import logging
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentCategory, DocumentStatus
from app.services.storage import StorageService
from app.services.document_parsing import DocumentParsingService, DocumentParsingError
from app.services.ai_extraction import AIExtractionService, AIExtractionError

logger = logging.getLogger(__name__)


class DocumentService:
    """Manage document upload, parsing, and AI extraction."""

    def __init__(
        self,
        db: AsyncSession,
        company_id: UUID,
        user_id: Optional[UUID] = None,
    ):
        """
        Initialize DocumentService.

        Args:
            db: AsyncSession for database operations
            company_id: Company ID for multi-tenancy
            user_id: User ID for activity logging
        """
        self.db = db
        self.company_id = company_id
        self.user_id = user_id
        self.storage_service = StorageService()
        self.parsing_service = DocumentParsingService()
        self.ai_service = AIExtractionService()

    async def upload_and_process_document(
        self,
        file_content: bytes,
        filename: str,
        mime_type: str,
        category: DocumentCategory,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID | str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Document:
        """
        Upload file and process it synchronously.

        Flow:
        1. Upload to MinIO
        2. Create DB record (status=PROCESSING)
        3. Download file and extract text
        4. Send to Claude for structured extraction
        5. Update DB with results (status=COMPLETED/FAILED)
        6. Log activity

        Args:
            file_content: Raw file bytes
            filename: Original filename
            mime_type: File MIME type
            category: Document category
            entity_type: Optional entity type (Deal, Quote, etc.)
            entity_id: Optional entity ID
            description: Optional user description
            tags: Optional list of tags

        Returns:
            Document record (with all extracted data)

        Raises:
            ValueError: If validation fails
            Exception: If processing fails (catches and saves status=FAILED)
        """
        # Validation
        if not file_content:
            raise ValueError("File content cannot be empty")

        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > 25:
            raise ValueError(f"File too large: {file_size_mb:.1f}MB (max 25MB)")

        # Convert entity_id to UUID if it's a string
        if entity_id and isinstance(entity_id, str):
            entity_id = UUID(entity_id)

        if entity_type and not entity_id:
            raise ValueError("entity_id required when entity_type is specified")

        try:
            # Step 1: Upload to MinIO
            logger.info(f"Uploading {filename} to MinIO...")
            storage_key = self.storage_service.upload_file(
                file_content=file_content,
                filename=filename,
                company_id=self.company_id,
                content_type=mime_type,
            )

            # Step 2: Create initial DB record
            document = Document(
                company_id=self.company_id,
                entity_type=entity_type,
                entity_id=entity_id,
                category=category,
                storage_bucket="documents",  # From config
                storage_key=storage_key,
                original_filename=filename,
                file_size_bytes=len(file_content),
                mime_type=mime_type,
                status=DocumentStatus.PROCESSING,
                description=description,
                tags=tags or [],
            )
            self.db.add(document)
            await self.db.flush()
            logger.info(f"Created document record: {document.id}")

            # Step 3: Extract text
            logger.info("Extracting text from document...")
            try:
                extracted_text = self.parsing_service.extract_text(file_content, mime_type)
                document.extracted_text = extracted_text
                logger.info(f"Extracted {len(extracted_text)} characters")
            except DocumentParsingError as e:
                logger.warning(f"Text extraction failed: {e}, continuing with empty text")
                document.extracted_text = ""

            # Step 4: AI Extraction
            logger.info(f"Sending to Claude for {category.value} extraction...")
            try:
                if document.extracted_text:  # Only if we have text
                    extraction_result = self.ai_service.extract_structured_data(
                        extracted_text=document.extracted_text,
                        category=category,
                    )
                    document.parsed_data = extraction_result.get("data", {})
                    document.ai_confidence_score = float(extraction_result.get("confidence", 0.5))
                    logger.info(
                        f"AI extraction complete, confidence: {document.ai_confidence_score:.2f}"
                    )
                else:
                    logger.warning("No text to send to AI")
                    document.parsed_data = {}
                    document.ai_confidence_score = 0.0

            except AIExtractionError as e:
                logger.error(f"AI extraction failed: {e}")
                document.parsed_data = {}
                document.ai_confidence_score = 0.0
                document.error_message = str(e)[:1000]

            # Step 5: Mark as completed
            document.status = DocumentStatus.COMPLETED
            await self.db.flush()
            logger.info(f"Document processing complete: {document.id}")

            await self.db.commit()
            return document

        except Exception as e:
            # Step 5b: Mark as failed
            logger.error(f"Document processing failed: {e}", exc_info=True)
            if "document" in locals():
                document.status = DocumentStatus.FAILED
                document.error_message = str(e)[:1000]
                await self.db.flush()
                await self.db.commit()
                return document
            else:
                raise

    async def get_document(self, document_id: UUID) -> Optional[Document]:
        """
        Get single document with company isolation.

        Args:
            document_id: Document ID

        Returns:
            Document record or None if not found

        Raises:
            ValueError: If not authorized (document belongs to different company)
        """
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.company_id == self.company_id,
                    Document.deleted_at.is_(None),
                )
            )
        )
        document = result.scalar_one_or_none()

        if document and document.company_id != self.company_id:
            raise ValueError("Not authorized to access this document")

        return document

    async def list_documents(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        category: Optional[DocumentCategory] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[Document], int]:
        """
        List documents with optional filtering.

        Args:
            entity_type: Filter by entity type (e.g., "Deal")
            entity_id: Filter by entity ID
            category: Filter by document category
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            (List of documents, total count)
        """
        # Base query
        query = select(Document).where(
            and_(
                Document.company_id == self.company_id,
                Document.deleted_at.is_(None),
                Document.entity_type.isnot(None),  # Only entity documents
            )
        )

        # Apply filters
        if entity_type:
            query = query.where(Document.entity_type == entity_type)
        if entity_id:
            query = query.where(Document.entity_id == entity_id)
        if category:
            query = query.where(Document.category == category)

        # Count total
        count_result = await self.db.execute(
            select(func.count(Document.id)).where(
                and_(
                    Document.company_id == self.company_id,
                    Document.deleted_at.is_(None),
                    Document.entity_type.isnot(None),
                )
            )
        )
        total = count_result.scalar() or 0

        # Apply pagination and order
        query = query.order_by(Document.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        documents = result.scalars().all()

        return documents, total

    async def list_company_documents(
        self,
        category: Optional[DocumentCategory] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[Document], int]:
        """
        List company-level documents (no entity attached).

        Args:
            category: Filter by category
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            (List of company documents, total count)
        """
        # Company docs have entity_type = NULL
        query = select(Document).where(
            and_(
                Document.company_id == self.company_id,
                Document.entity_type.is_(None),
                Document.deleted_at.is_(None),
            )
        )

        if category:
            query = query.where(Document.category == category)

        # Count total
        count_query = select(func.count(Document.id)).where(
            and_(
                Document.company_id == self.company_id,
                Document.entity_type.is_(None),
                Document.deleted_at.is_(None),
            )
        )
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Apply pagination and order
        query = query.order_by(Document.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        documents = result.scalars().all()

        return documents, total

    async def get_download_url(self, document_id: UUID) -> str:
        """
        Get presigned download URL for document.

        Args:
            document_id: Document ID

        Returns:
            Presigned URL (valid for 1 hour)

        Raises:
            ValueError: If document not found or not authorized
        """
        document = await self.get_document(document_id)
        if not document:
            raise ValueError("Document not found")

        url = self.storage_service.get_presigned_url(document.storage_key, expiry_minutes=60)
        logger.info(f"Generated download URL for document: {document_id}")
        return url

    async def delete_document(self, document_id: UUID) -> None:
        """
        Soft delete document.

        Args:
            document_id: Document ID

        Raises:
            ValueError: If document not found or not authorized
        """
        document = await self.get_document(document_id)
        if not document:
            raise ValueError("Document not found")

        document.deleted_at = datetime.utcnow()
        await self.db.flush()
        await self.db.commit()
        logger.info(f"Soft deleted document: {document_id}")
