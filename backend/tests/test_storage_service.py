"""Tests for Storage Service - MinIO operations."""
import pytest
from unittest.mock import patch, Mock
from uuid import uuid4

from app.services.storage import StorageService


class TestStorageService:
    """Test storage service for MinIO operations."""

    @pytest.fixture
    def storage_service(self):
        """Create storage service with mocked MinIO client."""
        with patch('app.services.storage.Minio'):
            service = StorageService()
            service.client = Mock()
            service.bucket_name = "documents"
            return service

    def test_upload_file(self, storage_service):
        """Test uploading a file to MinIO."""
        company_id = uuid4()
        file_content = b"Test file content"
        filename = "test.pdf"

        # Mock MinIO put_object
        storage_service.client.put_object.return_value = Mock()

        storage_key = storage_service.upload_file(
            file_content=file_content,
            filename=filename,
            company_id=company_id,
            content_type="application/pdf"
        )

        # Verify storage key format: company_id/YYYY-MM/uuid_filename
        assert str(company_id) in storage_key
        assert "test.pdf" in storage_key
        assert "/" in storage_key

        # Verify MinIO was called
        storage_service.client.put_object.assert_called_once()
        call_args = storage_service.client.put_object.call_args
        assert call_args.kwargs['bucket_name'] == "documents"
        assert call_args.kwargs['object_name'] == storage_key
        assert call_args.kwargs['length'] == len(file_content)

    def test_upload_file_different_content_types(self, storage_service):
        """Test uploading files with different MIME types."""
        company_id = uuid4()

        test_cases = [
            ("document.pdf", "application/pdf"),
            ("spreadsheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            ("image.jpg", "image/jpeg"),
            ("text.txt", "text/plain"),
        ]

        for filename, content_type in test_cases:
            storage_service.client.put_object.reset_mock()

            storage_key = storage_service.upload_file(
                file_content=b"content",
                filename=filename,
                company_id=company_id,
                content_type=content_type
            )

            assert filename in storage_key
            call_args = storage_service.client.put_object.call_args
            assert call_args.kwargs['content_type'] == content_type

    def test_download_file(self, storage_service):
        """Test downloading a file from MinIO."""
        storage_key = "company_id/2026-02/test_123.pdf"
        expected_content = b"PDF content here"

        # Mock MinIO get_object
        mock_response = Mock()
        mock_response.read.return_value = expected_content
        mock_response.close = Mock()
        storage_service.client.get_object.return_value = mock_response

        content = storage_service.download_file(storage_key)

        assert content == expected_content
        storage_service.client.get_object.assert_called_once_with(
            bucket_name="documents",
            object_name=storage_key
        )

    def test_get_presigned_url(self, storage_service):
        """Test generating presigned download URL."""
        storage_key = "company_id/2026-02/test_123.pdf"
        expected_url = "https://minio.example.com/documents/company_id/2026-02/test_123.pdf?token=abc123"

        # Mock MinIO get_presigned_download_url
        storage_service.client.get_presigned_download_url.return_value = expected_url

        url = storage_service.get_presigned_url(storage_key, expiry_minutes=60)

        assert url == expected_url
        storage_service.client.get_presigned_download_url.assert_called_once()
        call_kwargs = storage_service.client.get_presigned_download_url.call_args.kwargs
        assert call_kwargs['bucket_name'] == "documents"
        assert call_kwargs['object_name'] == storage_key

    def test_get_presigned_url_custom_expiry(self, storage_service):
        """Test presigned URL with custom expiry time."""
        storage_key = "test.pdf"

        storage_service.client.get_presigned_download_url.return_value = "http://url"

        # Test different expiry times
        for minutes in [15, 30, 60, 120]:
            storage_service.client.get_presigned_download_url.reset_mock()
            storage_service.get_presigned_url(storage_key, expiry_minutes=minutes)

            # Verify expires parameter was passed
            call_kwargs = storage_service.client.get_presigned_download_url.call_args.kwargs
            assert 'expires' in call_kwargs

    def test_delete_file(self, storage_service):
        """Test deleting a file from MinIO."""
        storage_key = "company_id/2026-02/test_123.pdf"

        storage_service.client.remove_object.return_value = None

        storage_service.delete_file(storage_key)

        storage_service.client.remove_object.assert_called_once_with(
            bucket_name="documents",
            object_name=storage_key
        )

    def test_upload_file_large_file(self, storage_service):
        """Test uploading a large file."""
        company_id = uuid4()
        # 10MB file
        large_content = b"x" * (10 * 1024 * 1024)

        storage_key = storage_service.upload_file(
            file_content=large_content,
            filename="large_file.pdf",
            company_id=company_id
        )

        assert storage_key is not None
        call_args = storage_service.client.put_object.call_args
        assert call_args.kwargs['length'] == len(large_content)

    def test_storage_path_format(self, storage_service):
        """Test that storage paths follow expected format: company_id/YYYY-MM/uuid_filename."""
        company_id = uuid4()

        storage_key = storage_service.upload_file(
            file_content=b"content",
            filename="document.pdf",
            company_id=company_id
        )

        # Parse the storage key
        parts = storage_key.split('/')
        assert len(parts) == 3, f"Expected 3 path parts, got {len(parts)}"

        # Check format: company_id/YYYY-MM/uuid_filename
        assert str(company_id) in parts[0]
        assert "-" in parts[1]  # Date format YYYY-MM
        assert "document.pdf" in parts[2]
        assert "_" in parts[2]  # UUID_filename format

    def test_multiple_files_different_names(self, storage_service):
        """Test that files with different names get unique storage keys."""
        company_id = uuid4()

        key1 = storage_service.upload_file(
            file_content=b"content1",
            filename="document1.pdf",
            company_id=company_id
        )

        key2 = storage_service.upload_file(
            file_content=b"content2",
            filename="document2.pdf",
            company_id=company_id
        )

        # Keys should be different
        assert key1 != key2

        # Both should contain their respective filenames
        assert "document1.pdf" in key1
        assert "document2.pdf" in key2

        # Both should have same company_id prefix
        assert key1.split('/')[0] == key2.split('/')[0]
