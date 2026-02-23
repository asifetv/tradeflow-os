"""Tests for M4 Document Management - Document Service."""
import pytest
import io
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock

from app.models.document import Document, DocumentCategory, DocumentStatus
from app.models.deal import Deal, DealStatus
from app.services.document import DocumentService
from app.services.storage import StorageService
from app.services.document_parsing import DocumentParsingService, DocumentParsingError
from app.services.ai_extraction import AIExtractionService, AIExtractionError


class TestDocumentService:
    """Test document management service."""

    @pytest.mark.asyncio
    async def test_upload_and_process_document(self, test_db, sample_company, sample_user):
        """Test uploading and processing a document (full flow)."""
        # Mock the external services
        with patch.object(StorageService, 'upload_file') as mock_storage, \
             patch.object(DocumentParsingService, 'extract_text') as mock_parsing, \
             patch.object(AIExtractionService, 'extract_structured_data') as mock_ai:

            mock_storage.return_value = "company_id/2026-02/abc123_test.pdf"
            mock_parsing.return_value = "Sample RFQ with line items"
            mock_ai.return_value = {
                "data": {"customer_name": "ABC Corp", "quantity": 100},
                "confidence": 0.85
            }

            service = DocumentService(
                test_db,
                company_id=sample_company.id,
                user_id=sample_user.id
            )

            document = await service.upload_and_process_document(
                file_content=b"PDF content here",
                filename="test_rfq.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.RFQ,
                description="Test RFQ",
                tags=["urgent", "new"]
            )

            # Verify document was created
            assert document.id is not None
            assert document.company_id == sample_company.id
            assert document.original_filename == "test_rfq.pdf"
            assert document.file_size_bytes == 16
            assert document.status == DocumentStatus.COMPLETED
            assert document.ai_confidence_score == 0.85
            assert document.parsed_data == {"customer_name": "ABC Corp", "quantity": 100}
            assert document.tags == ["urgent", "new"]

    @pytest.mark.asyncio
    async def test_document_with_entity_reference(self, test_db, sample_company, sample_user, sample_deal):
        """Test uploading document attached to an entity (Deal)."""
        with patch.object(StorageService, 'upload_file') as mock_storage, \
             patch.object(DocumentParsingService, 'extract_text') as mock_parsing, \
             patch.object(AIExtractionService, 'extract_structured_data') as mock_ai:

            mock_storage.return_value = "company_id/2026-02/xyz789_proposal.pdf"
            mock_parsing.return_value = "Vendor proposal with pricing"
            mock_ai.return_value = {
                "data": {"total_price": 50000, "lead_time_days": 30},
                "confidence": 0.92
            }

            service = DocumentService(
                test_db,
                company_id=sample_company.id,
                user_id=sample_user.id
            )

            document = await service.upload_and_process_document(
                file_content=b"Proposal content",
                filename="vendor_proposal.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.VENDOR_PROPOSAL,
                entity_type="Deal",
                entity_id=str(sample_deal.id),
                description="Vendor proposal for deal"
            )

            # Verify entity reference
            assert document.entity_type == "Deal"
            assert document.entity_id == sample_deal.id
            assert document.category == DocumentCategory.VENDOR_PROPOSAL

    @pytest.mark.asyncio
    async def test_document_without_entity_reference(self, test_db, sample_company, sample_user):
        """Test uploading company-level document (no entity reference)."""
        with patch.object(StorageService, 'upload_file') as mock_storage, \
             patch.object(DocumentParsingService, 'extract_text') as mock_parsing, \
             patch.object(AIExtractionService, 'extract_structured_data') as mock_ai:

            mock_storage.return_value = "company_id/2026-02/policy.pdf"
            mock_parsing.return_value = "Company policy document"
            mock_ai.return_value = {
                "data": {"policy_name": "Code of Conduct"},
                "confidence": 0.88
            }

            service = DocumentService(
                test_db,
                company_id=sample_company.id,
                user_id=sample_user.id
            )

            document = await service.upload_and_process_document(
                file_content=b"Policy content",
                filename="code_of_conduct.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.COMPANY_POLICY
            )

            # Verify company document (no entity reference)
            assert document.entity_type is None
            assert document.entity_id is None

    @pytest.mark.asyncio
    async def test_document_file_size_validation(self, test_db, sample_company, sample_user):
        """Test file size validation (max 25MB)."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        # Create 26MB file
        large_content = b"x" * (26 * 1024 * 1024)

        with pytest.raises(ValueError, match="File too large"):
            await service.upload_and_process_document(
                file_content=large_content,
                filename="large_file.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.RFQ
            )

    @pytest.mark.asyncio
    async def test_document_parsing_error_handling(self, test_db, sample_company, sample_user):
        """Test graceful handling when text extraction fails."""
        with patch.object(StorageService, 'upload_file') as mock_storage, \
             patch.object(DocumentParsingService, 'extract_text') as mock_parsing, \
             patch.object(AIExtractionService, 'extract_structured_data') as mock_ai:

            mock_storage.return_value = "company_id/2026-02/corrupt.pdf"
            mock_parsing.side_effect = DocumentParsingError("PDF extraction failed")
            mock_ai.return_value = {"data": {}, "confidence": 0.0}

            service = DocumentService(
                test_db,
                company_id=sample_company.id,
                user_id=sample_user.id
            )

            document = await service.upload_and_process_document(
                file_content=b"Corrupt PDF",
                filename="corrupt.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.RFQ
            )

            # Should still create document but with warning
            assert document.status == DocumentStatus.COMPLETED
            assert document.extracted_text == ""

    @pytest.mark.asyncio
    async def test_document_ai_extraction_error_handling(self, test_db, sample_company, sample_user):
        """Test graceful handling when AI extraction fails."""
        with patch.object(StorageService, 'upload_file') as mock_storage, \
             patch.object(DocumentParsingService, 'extract_text') as mock_parsing, \
             patch.object(AIExtractionService, 'extract_structured_data') as mock_ai:

            mock_storage.return_value = "company_id/2026-02/test.pdf"
            mock_parsing.return_value = "Some text"
            mock_ai.side_effect = AIExtractionError("Claude API timeout")

            service = DocumentService(
                test_db,
                company_id=sample_company.id,
                user_id=sample_user.id
            )

            document = await service.upload_and_process_document(
                file_content=b"PDF content",
                filename="test.pdf",
                mime_type="application/pdf",
                category=DocumentCategory.RFQ
            )

            # Should still create document but with error message
            assert document.status == DocumentStatus.COMPLETED
            assert "timeout" in document.error_message.lower()

    @pytest.mark.asyncio
    async def test_get_document(self, test_db, sample_company, sample_user, sample_document):
        """Test retrieving a document."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        document = await service.get_document(sample_document.id)

        assert document is not None
        assert document.id == sample_document.id
        assert document.original_filename == sample_document.original_filename

    @pytest.mark.asyncio
    async def test_get_document_not_found(self, test_db, sample_company, sample_user):
        """Test retrieving non-existent document."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        document = await service.get_document(uuid4())

        assert document is None

    @pytest.mark.asyncio
    async def test_list_documents_by_entity(self, test_db, sample_company, sample_user, sample_deal):
        """Test listing documents filtered by entity."""
        # Create multiple documents
        await _create_test_documents(test_db, sample_company, sample_deal, count=3)

        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        documents, total = await service.list_documents(
            entity_type="Deal",
            entity_id=sample_deal.id
        )

        assert total == 3
        assert len(documents) == 3
        assert all(doc.entity_type == "Deal" for doc in documents)

    @pytest.mark.asyncio
    async def test_list_documents_by_category(self, test_db, sample_company, sample_user):
        """Test listing documents filtered by category."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        documents, total = await service.list_documents(
            category=DocumentCategory.RFQ,
            limit=10
        )

        # Should only return RFQ documents
        assert all(doc.category == DocumentCategory.RFQ for doc in documents)

    @pytest.mark.asyncio
    async def test_list_company_documents(self, test_db, sample_company, sample_user):
        """Test listing company-level documents (no entity)."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        documents, total = await service.list_company_documents(
            category=DocumentCategory.COMPANY_POLICY
        )

        # Should only return company documents (entity_type is NULL)
        assert all(doc.entity_type is None for doc in documents)

    @pytest.mark.asyncio
    async def test_document_pagination(self, test_db, sample_company, sample_user, sample_deal):
        """Test pagination of document listings."""
        # Create 15 documents
        await _create_test_documents(test_db, sample_company, sample_deal, count=15)

        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        # Get first page
        page1, total1 = await service.list_documents(
            entity_type="Deal",
            entity_id=sample_deal.id,
            skip=0,
            limit=10
        )

        # Get second page
        page2, total2 = await service.list_documents(
            entity_type="Deal",
            entity_id=sample_deal.id,
            skip=10,
            limit=10
        )

        assert total1 == 15
        assert total2 == 15
        assert len(page1) == 10
        assert len(page2) == 5
        assert page1[0].id != page2[0].id

    @pytest.mark.asyncio
    async def test_delete_document(self, test_db, sample_company, sample_user, sample_document):
        """Test soft delete of document."""
        service = DocumentService(
            test_db,
            company_id=sample_company.id,
            user_id=sample_user.id
        )

        await service.delete_document(sample_document.id)

        # Verify soft delete
        document = await service.get_document(sample_document.id)
        assert document is None  # Soft deleted, so not returned

    @pytest.mark.asyncio
    async def test_multi_tenancy_isolation(self, test_db, sample_company, sample_user, sample_document):
        """Test that documents are isolated by company."""
        other_company_id = uuid4()

        service = DocumentService(
            test_db,
            company_id=other_company_id,
            user_id=sample_user.id
        )

        # Should not be able to access document from different company
        document = await service.get_document(sample_document.id)
        assert document is None


# Helper fixtures and functions

@pytest.fixture
async def sample_document(test_db, sample_company):
    """Create a sample document for testing."""
    document = Document(
        id=uuid4(),
        company_id=sample_company.id,
        entity_type="Deal",
        entity_id=uuid4(),
        category=DocumentCategory.RFQ,
        storage_bucket="documents",
        storage_key="company_id/2026-02/test_123.pdf",
        original_filename="test_rfq.pdf",
        file_size_bytes=1024,
        mime_type="application/pdf",
        extracted_text="Sample RFQ text",
        parsed_data={"customer_name": "ABC Corp"},
        status=DocumentStatus.COMPLETED,
        ai_confidence_score=0.85
    )
    test_db.add(document)
    await test_db.flush()
    return document


@pytest.fixture
async def sample_deal(test_db, sample_company):
    """Create a sample deal for testing."""
    deal = Deal(
        id=uuid4(),
        company_id=sample_company.id,
        deal_number=f"DEAL-{uuid4().hex[:8]}",
        status=DealStatus.RFQ_RECEIVED,
        description="Test deal",
        line_items=[]
    )
    test_db.add(deal)
    await test_db.flush()
    return deal


async def _create_test_documents(test_db, company, deal, count=1):
    """Helper to create multiple test documents."""
    for i in range(count):
        doc = Document(
            id=uuid4(),
            company_id=company.id,
            entity_type="Deal",
            entity_id=deal.id,
            category=DocumentCategory.RFQ,
            storage_bucket="documents",
            storage_key=f"company_id/2026-02/doc_{i}.pdf",
            original_filename=f"document_{i}.pdf",
            file_size_bytes=1024 * (i + 1),
            mime_type="application/pdf",
            extracted_text=f"Document {i} text",
            parsed_data={"doc_index": i},
            status=DocumentStatus.COMPLETED,
            ai_confidence_score=0.85
        )
        test_db.add(doc)
    await test_db.flush()
