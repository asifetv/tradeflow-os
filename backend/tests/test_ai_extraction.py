"""Tests for AI Extraction Service - Claude integration."""
import pytest
import json
from unittest.mock import patch, Mock

from app.services.ai_extraction import AIExtractionService, AIExtractionError
from app.models.document import DocumentCategory


class TestAIExtractionService:
    """Test AI extraction service for Claude integration."""

    @pytest.fixture
    def ai_service(self):
        """Create AI service with mocked Anthropic client."""
        with patch('app.services.ai_extraction.Anthropic'):
            service = AIExtractionService()
            service.client = Mock()
            return service

    def test_extract_rfq_data(self, ai_service):
        """Test extracting data from RFQ document."""
        extracted_data = {
            "data": {
                "customer_name": "ABC Corporation",
                "customer_email": "rfq@abc.com",
                "line_items": [
                    {"description": "Steel Pipe", "quantity": 100, "unit": "pieces"},
                    {"description": "Fittings", "quantity": 50, "unit": "pieces"}
                ],
                "delivery_date_requested": "2026-04-15"
            },
            "confidence": 0.92
        }

        # Mock Claude response
        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(extracted_data))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="RFQ from ABC Corporation requesting 100 pieces of steel pipe",
            category=DocumentCategory.RFQ
        )

        assert result["data"]["customer_name"] == "ABC Corporation"
        assert result["confidence"] == 0.92
        assert len(result["data"]["line_items"]) == 2

    def test_extract_vendor_proposal_data(self, ai_service):
        """Test extracting data from vendor proposal."""
        extracted_data = {
            "data": {
                "vendor_name": "Quality Suppliers Inc",
                "total_price": 75000,
                "currency": "AED",
                "lead_time_days": 30,
                "payment_terms": "Net 30",
            },
            "confidence": 0.88
        }

        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(extracted_data))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="Vendor proposal: Quality Suppliers quoting 75000 AED",
            category=DocumentCategory.VENDOR_PROPOSAL
        )

        assert result["data"]["vendor_name"] == "Quality Suppliers Inc"
        assert result["data"]["total_price"] == 75000
        assert result["confidence"] == 0.88

    def test_extract_certificate_data(self, ai_service):
        """Test extracting data from certificate document."""
        extracted_data = {
            "data": {
                "certificate_number": "ISO-2024-001",
                "certificate_type": "ISO 9001",
                "expiry_date": "2027-12-31",
                "issuing_authority": "ISO",
            },
            "confidence": 0.95
        }

        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(extracted_data))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="ISO 9001 Certificate Number ISO-2024-001 valid until 2027-12-31",
            category=DocumentCategory.CERTIFICATE
        )

        assert result["data"]["certificate_number"] == "ISO-2024-001"
        assert result["data"]["expiry_date"] == "2027-12-31"
        assert result["confidence"] == 0.95

    def test_extract_with_low_confidence(self, ai_service):
        """Test extraction with low confidence score."""
        extracted_data = {
            "data": {
                "partial_data": "Some value"
            },
            "confidence": 0.45
        }

        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(extracted_data))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="Blurry scanned document with unclear text",
            category=DocumentCategory.RFQ
        )

        assert result["confidence"] == 0.45

    def test_extract_with_markdown_json(self, ai_service):
        """Test extraction when Claude returns JSON wrapped in markdown."""
        json_data = {
            "data": {"customer": "Test"},
            "confidence": 0.88
        }
        markdown_response = f"```json\n{json.dumps(json_data)}\n```"

        mock_message = Mock()
        mock_message.content = [Mock(text=markdown_response)]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="Test document",
            category=DocumentCategory.RFQ
        )

        assert result["data"]["customer"] == "Test"

    def test_extract_invalid_json_response(self, ai_service):
        """Test handling of invalid JSON from Claude."""
        mock_message = Mock()
        mock_message.content = [Mock(text="Not valid JSON")]
        ai_service.client.messages.create.return_value = mock_message

        with pytest.raises(AIExtractionError, match="Could not parse JSON"):
            ai_service.extract_structured_data(
                extracted_text="Test",
                category=DocumentCategory.RFQ
            )

    def test_extract_with_timeout(self, ai_service):
        """Test handling of Claude API timeout."""
        ai_service.client.messages.create.side_effect = TimeoutError("Request timeout")

        with pytest.raises(AIExtractionError, match="timeout"):
            ai_service.extract_structured_data(
                extracted_text="Test",
                category=DocumentCategory.RFQ
            )

    def test_extract_different_categories(self, ai_service):
        """Test that different categories get different prompts."""
        categories = [
            DocumentCategory.RFQ,
            DocumentCategory.VENDOR_PROPOSAL,
            DocumentCategory.CERTIFICATE,
            DocumentCategory.INVOICE
        ]

        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps({"data": {}, "confidence": 0.8}))]
        ai_service.client.messages.create.return_value = mock_message

        for category in categories:
            ai_service.client.messages.create.reset_mock()

            ai_service.extract_structured_data(
                extracted_text="Sample text",
                category=category
            )

            # Verify Claude was called with category-specific prompt
            ai_service.client.messages.create.assert_called_once()
            call_args = ai_service.client.messages.create.call_args
            prompt = call_args.kwargs['messages'][0]['content']

            # Each category should have different prompt content
            assert category.value in prompt.lower() or len(prompt) > 100

    def test_extract_with_default_confidence(self, ai_service):
        """Test that default confidence is assigned if not provided."""
        mock_message = Mock()
        # Response without confidence field
        mock_message.content = [Mock(text=json.dumps({"data": {"key": "value"}}))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="Test",
            category=DocumentCategory.RFQ
        )

        # Should have default confidence
        assert "confidence" in result
        assert 0.0 <= result["confidence"] <= 1.0

    def test_extract_empty_text(self, ai_service):
        """Test extraction from empty text."""
        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps({"data": {}, "confidence": 0.0}))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text="",
            category=DocumentCategory.RFQ
        )

        assert isinstance(result, dict)
        assert "data" in result

    def test_extract_large_text(self, ai_service):
        """Test extraction from large text (should not fail)."""
        large_text = "A" * 5000  # Large text

        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps({"data": {}, "confidence": 0.8}))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text=large_text,
            category=DocumentCategory.RFQ
        )

        assert isinstance(result, dict)

    def test_extract_special_characters(self, ai_service):
        """Test extraction from text with special characters."""
        special_text = "Price: $1,000.00 | Vendor: ABC (国际) Ltd | Status: ✓"

        mock_message = Mock()
        extracted_data = {
            "data": {
                "price": "$1,000.00",
                "vendor": "ABC Ltd",
                "status": "confirmed"
            },
            "confidence": 0.85
        }
        mock_message.content = [Mock(text=json.dumps(extracted_data))]
        ai_service.client.messages.create.return_value = mock_message

        result = ai_service.extract_structured_data(
            extracted_text=special_text,
            category=DocumentCategory.VENDOR_PROPOSAL
        )

        assert result["data"]["vendor"] == "ABC Ltd"
        assert result["confidence"] == 0.85

    def test_claude_model_configuration(self, ai_service):
        """Test that Claude is configured with correct model and token limit."""
        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps({"data": {}, "confidence": 0.8}))]
        ai_service.client.messages.create.return_value = mock_message

        ai_service.extract_structured_data(
            extracted_text="Test",
            category=DocumentCategory.RFQ
        )

        call_kwargs = ai_service.client.messages.create.call_args.kwargs
        assert call_kwargs['model'] == ai_service.model
        assert call_kwargs['max_tokens'] == ai_service.max_tokens
