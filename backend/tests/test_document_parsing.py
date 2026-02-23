"""Tests for Document Parsing Service - Text extraction."""
import pytest
from unittest.mock import patch, Mock

from app.services.document_parsing import DocumentParsingService, DocumentParsingError


class TestDocumentParsingService:
    """Test document parsing service for text extraction."""

    def test_extract_text_pdf(self):
        """Test extracting text from PDF."""
        pdf_content = b"%PDF-1.4\n%fake PDF content"

        with patch('app.services.document_parsing.pdfplumber.open') as mock_pdfplumber:
            # Mock PDF page
            mock_page = Mock()
            mock_page.extract_text.return_value = "RFQ from ABC Company\nQuantity: 100\nDelivery: 2026-03-31"

            mock_pdf = Mock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = Mock(return_value=mock_pdf)
            mock_pdf.__exit__ = Mock(return_value=None)

            mock_pdfplumber.return_value = mock_pdf

            text = DocumentParsingService.extract_text_from_pdf(pdf_content)

            assert "RFQ" in text
            assert "ABC Company" in text
            assert "100" in text

    def test_extract_text_excel(self):
        """Test extracting text from Excel file."""
        with patch('app.services.document_parsing.load_workbook') as mock_excel:
            # Mock Excel workbook
            mock_sheet = Mock()
            mock_sheet.iter_rows.return_value = [
                [Mock(value="Product"), Mock(value="Quantity"), Mock(value="Price")],
                [Mock(value="Widget"), Mock(value=100), Mock(value=50.00)],
                [Mock(value="Gadget"), Mock(value=50), Mock(value=75.00)],
            ]

            mock_workbook = Mock()
            mock_workbook.sheetnames = ["Sheet1"]
            mock_workbook.__getitem__ = Mock(return_value=mock_sheet)

            mock_excel.return_value = mock_workbook

            text = DocumentParsingService.extract_text_from_excel(b"fake excel content")

            assert "Sheet1" in text
            assert "Product" in text
            assert "Widget" in text
            assert "100" in text

    def test_extract_text_word(self):
        """Test extracting text from Word document."""
        with patch('app.services.document_parsing.DocxDocument') as mock_docx:
            # Mock Word document
            mock_paragraph1 = Mock()
            mock_paragraph1.text = "Company Policy Document"

            mock_paragraph2 = Mock()
            mock_paragraph2.text = "All employees must follow these guidelines"

            mock_docx_instance = Mock()
            mock_docx_instance.paragraphs = [mock_paragraph1, mock_paragraph2]
            mock_docx_instance.tables = []

            mock_docx.return_value = mock_docx_instance

            text = DocumentParsingService.extract_text_from_word(b"fake docx content")

            assert "Company Policy" in text
            assert "employees" in text

    def test_extract_text_image_ocr(self):
        """Test extracting text from image using OCR."""
        with patch('app.services.document_parsing.pytesseract.image_to_string') as mock_ocr, \
             patch('app.services.document_parsing.Image.open') as mock_image:

            mock_ocr.return_value = "Certificate Number: 12345\nExpiry: 2027-12-31"

            image_data = b"fake image data"
            text = DocumentParsingService.extract_text_from_image(image_data)

            assert "Certificate" in text
            assert "12345" in text

    def test_extract_text_router(self):
        """Test the extract_text router method with different MIME types."""
        with patch.object(DocumentParsingService, 'extract_text_from_pdf') as mock_pdf, \
             patch.object(DocumentParsingService, 'extract_text_from_excel') as mock_excel, \
             patch.object(DocumentParsingService, 'extract_text_from_word') as mock_word, \
             patch.object(DocumentParsingService, 'extract_text_from_image') as mock_image:

            mock_pdf.return_value = "PDF text"
            mock_excel.return_value = "Excel text"
            mock_word.return_value = "Word text"
            mock_image.return_value = "Image text"

            # Test PDF
            result = DocumentParsingService.extract_text(b"pdf", "application/pdf")
            assert result == "PDF text"
            mock_pdf.assert_called_once()

            # Test Excel
            result = DocumentParsingService.extract_text(
                b"excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            assert result == "Excel text"
            mock_excel.assert_called_once()

            # Test Word
            result = DocumentParsingService.extract_text(
                b"word",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            assert result == "Word text"
            mock_word.assert_called_once()

            # Test Image
            result = DocumentParsingService.extract_text(b"image", "image/jpeg")
            assert result == "Image text"
            mock_image.assert_called_once()

    def test_extract_text_unsupported_format(self):
        """Test extraction of unsupported file format."""
        with pytest.raises(DocumentParsingError, match="Unsupported MIME type"):
            DocumentParsingService.extract_text(b"content", "application/zip")

    def test_extract_text_truncation(self):
        """Test that extracted text is truncated to max length."""
        long_text = "x" * 10000

        with patch('app.services.document_parsing.pdfplumber.open') as mock_pdfplumber:
            mock_page = Mock()
            mock_page.extract_text.return_value = long_text

            mock_pdf = Mock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = Mock(return_value=mock_pdf)
            mock_pdf.__exit__ = Mock(return_value=None)

            mock_pdfplumber.return_value = mock_pdf

            text = DocumentParsingService.extract_text_from_pdf(b"pdf")

            # Should be truncated to MAX_TEXT_LENGTH
            assert len(text) <= DocumentParsingService.MAX_TEXT_LENGTH

    def test_extract_text_multiple_pages(self):
        """Test extracting text from multi-page PDF."""
        with patch('app.services.document_parsing.pdfplumber.open') as mock_pdfplumber:
            # Mock 3 pages
            pages = []
            for i in range(3):
                mock_page = Mock()
                mock_page.extract_text.return_value = f"Page {i+1} content"
                pages.append(mock_page)

            mock_pdf = Mock()
            mock_pdf.pages = pages
            mock_pdf.__enter__ = Mock(return_value=mock_pdf)
            mock_pdf.__exit__ = Mock(return_value=None)

            mock_pdfplumber.return_value = mock_pdf

            text = DocumentParsingService.extract_text_from_pdf(b"pdf")

            # Should contain content from all pages
            assert "Page 1" in text
            assert "Page 2" in text
            assert "Page 3" in text

    def test_extract_text_empty_file(self):
        """Test extraction from empty file."""
        with patch('app.services.document_parsing.pdfplumber.open') as mock_pdfplumber:
            mock_page = Mock()
            mock_page.extract_text.return_value = ""

            mock_pdf = Mock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = Mock(return_value=mock_pdf)
            mock_pdf.__exit__ = Mock(return_value=None)

            mock_pdfplumber.return_value = mock_pdf

            text = DocumentParsingService.extract_text_from_pdf(b"empty pdf")

            # Should return empty string without error
            assert isinstance(text, str)

    def test_extract_text_with_special_characters(self):
        """Test extraction of text with special characters."""
        with patch('app.services.document_parsing.pdfplumber.open') as mock_pdfplumber:
            special_text = "Price: $1,000.00 | Date: 2026-03-15 | Status: ✓"

            mock_page = Mock()
            mock_page.extract_text.return_value = special_text

            mock_pdf = Mock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = Mock(return_value=mock_pdf)
            mock_pdf.__exit__ = Mock(return_value=None)

            mock_pdfplumber.return_value = mock_pdf

            text = DocumentParsingService.extract_text_from_pdf(b"pdf")

            assert "$1,000.00" in text
            assert "2026-03-15" in text
