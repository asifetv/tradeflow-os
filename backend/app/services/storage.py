"""Storage service for MinIO/S3 operations."""
import io
import logging
from datetime import datetime, timedelta
from uuid import UUID
from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Manages file uploads and downloads to MinIO."""

    def __init__(self):
        """Initialize MinIO client."""
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to ensure bucket exists: {e}")
            raise

    def upload_file(
        self,
        file_content: bytes,
        filename: str,
        company_id: UUID,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload file to MinIO with company-scoped path.

        Args:
            file_content: Raw file bytes
            filename: Original filename (used for uniqueness)
            company_id: Company ID for path scoping
            content_type: MIME type of file

        Returns:
            storage_key: Path to file in MinIO (used for later retrieval)

        Raises:
            S3Error: If upload fails
        """
        try:
            # Generate unique storage key: company_id/YYYY-MM/uuid_filename
            now = datetime.utcnow()
            date_prefix = now.strftime("%Y-%m")
            import uuid
            unique_id = uuid.uuid4().hex[:8]
            storage_key = f"{company_id}/{date_prefix}/{unique_id}_{filename}"

            # Upload to MinIO
            file_size = len(file_content)
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=storage_key,
                data=io.BytesIO(file_content),
                length=file_size,
                content_type=content_type,
            )

            logger.info(f"Uploaded file to MinIO: {storage_key} ({file_size} bytes)")
            return storage_key

        except S3Error as e:
            logger.error(f"Failed to upload file: {e}")
            raise

    def download_file(self, storage_key: str) -> bytes:
        """
        Download file from MinIO.

        Args:
            storage_key: Path to file in MinIO

        Returns:
            File content as bytes

        Raises:
            S3Error: If download fails
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=storage_key,
            )
            content = response.read()
            response.close()
            logger.info(f"Downloaded file from MinIO: {storage_key} ({len(content)} bytes)")
            return content

        except S3Error as e:
            logger.error(f"Failed to download file: {e}")
            raise

    def get_presigned_url(
        self,
        storage_key: str,
        expiry_minutes: int = 60,
    ) -> str:
        """
        Generate temporary download URL for file.

        Args:
            storage_key: Path to file in MinIO
            expiry_minutes: URL expiry time in minutes (default 60)

        Returns:
            Presigned URL for temporary download

        Raises:
            S3Error: If URL generation fails
        """
        try:
            expiry = timedelta(minutes=expiry_minutes)
            url = self.client.get_presigned_download_url(
                bucket_name=self.bucket_name,
                object_name=storage_key,
                expires=expiry,
            )
            logger.info(f"Generated presigned URL for: {storage_key}")
            return url

        except S3Error as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    def delete_file(self, storage_key: str) -> None:
        """
        Delete file from MinIO.

        Args:
            storage_key: Path to file in MinIO

        Raises:
            S3Error: If deletion fails
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=storage_key,
            )
            logger.info(f"Deleted file from MinIO: {storage_key}")

        except S3Error as e:
            logger.error(f"Failed to delete file: {e}")
            raise
