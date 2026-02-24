"""AI extraction service using Anthropic Claude."""
import json
import logging
from typing import Any, Dict
from anthropic import Anthropic

from app.config import settings
from app.models.document import DocumentCategory

logger = logging.getLogger(__name__)


class AIExtractionError(Exception):
    """Raised when AI extraction fails."""

    pass


class AIExtractionService:
    """Extract structured data from documents using Claude."""

    def __init__(self):
        """Initialize Anthropic client."""
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL
        self.max_tokens = settings.ANTHROPIC_MAX_TOKENS

    def extract_structured_data(
        self,
        extracted_text: str,
        category: DocumentCategory,
    ) -> Dict[str, Any]:
        """
        Extract structured data from document text using Claude.

        Args:
            extracted_text: Raw text extracted from document
            category: Document category (drives prompt strategy)

        Returns:
            {
                "data": {...extracted fields...},
                "confidence": 0.0-1.0 confidence score,
                "raw_response": full Claude response (for debugging)
            }

        Raises:
            AIExtractionError: If extraction fails
        """
        try:
            prompt = self._build_prompt(extracted_text, category)

            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[{"role": "user", "content": prompt}],
                timeout=30,
            )

            response_text = message.content[0].text
            logger.info(f"Claude response received for {category.value}")

            # Parse JSON from response
            try:
                extracted_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON from response text if wrapped in markdown
                if "```json" in response_text:
                    json_str = response_text.split("```json")[1].split("```")[0].strip()
                    extracted_data = json.loads(json_str)
                elif "```" in response_text:
                    json_str = response_text.split("```")[1].split("```")[0].strip()
                    extracted_data = json.loads(json_str)
                else:
                    raise AIExtractionError("Could not parse JSON from Claude response")

            # Ensure required fields
            if "data" not in extracted_data:
                extracted_data = {"data": extracted_data}

            if "confidence" not in extracted_data:
                extracted_data["confidence"] = 0.8  # Default if not provided

            return extracted_data

        except AIExtractionError:
            raise
        except Exception as e:
            raise AIExtractionError(f"AI extraction failed: {str(e)}")

    @staticmethod
    def _build_prompt(extracted_text: str, category: DocumentCategory) -> str:
        """
        Build category-specific prompt for Claude.

        Args:
            extracted_text: Raw text from document
            category: Document category

        Returns:
            Prompt string for Claude

        Field Naming Conventions:
        - RFQ: 'unit_price_requested' in line items, top-level 'currency' from document
        - VENDOR_PROPOSAL: 'unit_price' in line items, top-level 'currency' required
        - INVOICE: 'unit_price' in line items, top-level 'currency' required
        - All categories must include currency at top level (not just in line items)
        """
        base_instruction = """You are an expert document data extractor. Extract structured data from the provided document text.

IMPORTANT:
- Return ONLY a valid JSON object
- Include a "confidence" field (0.0-1.0) indicating how confident you are in the extraction
- If a field cannot be confidently extracted, omit it or set to null
- Use nested objects for related fields
- Always return data within a "data" key in the response

Document Text:
```
{text}
```

""".format(
            text=extracted_text[:5000]  # Limit context to first 5000 chars
        )

        if category == DocumentCategory.RFQ:
            return (
                base_instruction
                + """Extract the following from this RFQ (Request for Quotation):
{
  "data": {
    "customer_name": "string",
    "customer_contact": "string",
    "customer_email": "string",
    "rfq_number": "string",
    "rfq_date": "YYYY-MM-DD",
    "delivery_date_requested": "YYYY-MM-DD",
    "currency": "string",
    "line_items": [
      {
        "description": "string",
        "specification": "string",
        "quantity": number,
        "unit": "string",
        "unit_price_requested": number,
        "currency": "string"
      }
    ],
    "total_value_requested": number,
    "special_requirements": "string",
    "payment_terms": "string"
  },
  "confidence": 0.0-1.0
}"""
            )

        elif category == DocumentCategory.VENDOR_PROPOSAL:
            return (
                base_instruction
                + """Extract the following from this Vendor Proposal:
{
  "data": {
    "vendor_name": "string",
    "vendor_contact": "string",
    "vendor_email": "string",
    "proposal_number": "string",
    "proposal_date": "YYYY-MM-DD",
    "validity_date": "YYYY-MM-DD",
    "line_items": [
      {
        "description": "string",
        "quantity": number,
        "unit": "string",
        "unit_price": number,
        "total_price": number,
        "currency": "string"
      }
    ],
    "total_price": number,
    "currency": "string",
    "lead_time_days": number,
    "payment_terms": "string",
    "delivery_terms": "string",
    "quality_guarantees": "string"
  },
  "confidence": 0.0-1.0
}"""
            )

        elif category == DocumentCategory.CERTIFICATE:
            return (
                base_instruction
                + """Extract the following from this Certificate (quality, compliance, or test cert):
{
  "data": {
    "certificate_number": "string",
    "certificate_type": "string",
    "issuing_authority": "string",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD",
    "scope": "string",
    "certified_entity": "string",
    "standards": ["string"],
    "validity_status": "string"
  },
  "confidence": 0.0-1.0
}"""
            )

        elif category == DocumentCategory.MATERIAL_CERTIFICATE:
            return (
                base_instruction
                + """Extract the following from this Material/Test Certificate:
{
  "data": {
    "batch_number": "string",
    "material_description": "string",
    "test_date": "YYYY-MM-DD",
    "test_results": {
      "tensile_strength": "string",
      "yield_strength": "string",
      "elongation": "string",
      "hardness": "string",
      "other_properties": {}
    },
    "grade": "string",
    "passes_specification": boolean,
    "inspector_name": "string",
    "notes": "string"
  },
  "confidence": 0.0-1.0
}"""
            )

        elif category == DocumentCategory.INVOICE:
            return (
                base_instruction
                + """Extract the following from this Invoice:
{
  "data": {
    "invoice_number": "string",
    "invoice_date": "YYYY-MM-DD",
    "invoice_from": "string",
    "invoice_to": "string",
    "line_items": [
      {
        "description": "string",
        "quantity": number,
        "unit_price": number,
        "total": number
      }
    ],
    "subtotal": number,
    "tax_amount": number,
    "total_amount": number,
    "currency": "string",
    "due_date": "YYYY-MM-DD",
    "payment_terms": "string"
  },
  "confidence": 0.0-1.0
}"""
            )

        else:
            # Generic extraction for other categories
            return (
                base_instruction
                + """Extract all relevant structured data from this document:
{
  "data": {
    "document_title": "string",
    "document_date": "YYYY-MM-DD",
    "key_fields": {},
    "summary": "string"
  },
  "confidence": 0.0-1.0
}"""
            )
