"""Storage service abstraction for local and cloud storage."""
import asyncio
import mimetypes
import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings


class StorageService(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    async def store(self, file_bytes: bytes, user_id: str, extension: str) -> str:
        """
        Store file and return storage key.
        Key format: {user_id}/{uuid4()}.{extension}
        """
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete file by storage key."""
        ...

    @abstractmethod
    async def get_url(self, key: str) -> str:
        """Get accessible URL for the stored file (if applicable)."""
        ...


class LocalStorageService(StorageService):
    """Local filesystem storage for development."""

    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or settings.STORAGE_LOCAL_PATH)

    async def store(self, file_bytes: bytes, user_id: str, extension: str) -> str:
        """Store file locally and return storage key."""
        # Generate key: {user_id}/{uuid}.{extension}
        file_id = uuid.uuid4()
        key = f"{user_id}/{file_id}.{extension}"

        # Create full path
        file_path = self.base_path / key
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        return key

    async def delete(self, key: str) -> None:
        """Delete file from local storage."""
        file_path = self.base_path / key
        if file_path.exists():
            file_path.unlink()

    async def get_url(self, key: str) -> str:
        """Return local file path as URL (not HTTP accessible)."""
        return str(self.base_path / key)


class SupabaseStorageService(StorageService):
    """Supabase Storage backend for production."""

    def __init__(self, supabase_client=None):
        """
        Initialize with supabase client.
        If client is None, creates one from settings.
        """
        if supabase_client is None:
            try:
                from supabase import create_client, Client
                self.client: Client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_KEY
                )
            except ImportError:
                raise RuntimeError(
                    "supabase-py package is required for SupabaseStorageService. "
                    "Install with: pip install supabase"
                )
        else:
            self.client = supabase_client

        self.bucket = settings.SUPABASE_BUCKET

    async def store(self, file_bytes: bytes, user_id: str, extension: str) -> str:
        """Upload to Supabase Storage and return key."""
        # Generate key
        file_id = uuid.uuid4()
        key = f"{user_id}/{file_id}.{extension}"

        # Upload to bucket
        self.client.storage.from_(self.bucket).upload(
            path=key,
            file=file_bytes,
            file_options={"content-type": f"application/{extension}"}
        )

        return key

    async def delete(self, key: str) -> None:
        """Delete from Supabase Storage."""
        self.client.storage.from_(self.bucket).remove([key])

    async def get_url(self, key: str) -> str:
        """Get public URL for the file."""
        response = self.client.storage.from_(self.bucket).get_public_url(key)
        return response


class S3StorageService(StorageService):
    """Amazon S3 storage backend for production.

    Uploaded objects are private by default. `get_url` returns a short-lived
    presigned URL suitable for direct download by the client.
    """

    def __init__(self, s3_client=None):
        """
        Initialize with a boto3 S3 client.
        If client is None, creates one from settings.
        """
        if s3_client is None:
            try:
                import boto3
                from botocore.config import Config as BotoConfig
            except ImportError as e:
                raise RuntimeError(
                    "boto3 is required for S3StorageService. "
                    "Install with: pip install boto3"
                ) from e

            if not settings.S3_BUCKET:
                raise RuntimeError(
                    "S3_BUCKET is not configured. Set it in the environment."
                )

            # Signature v4 is required for most non-legacy regions (e.g. ap-south-1).
            boto_config = BotoConfig(
                region_name=settings.AWS_REGION,
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            )

            # If explicit access keys are provided, use them. Otherwise fall
            # back to the default boto3 credential chain (env vars, IAM role,
            # SSO cache, etc.). This is what makes the same code work on
            # local dev and on Render/EC2 with an instance profile.
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    config=boto_config,
                )
            else:
                self.client = boto3.client("s3", config=boto_config)
        else:
            self.client = s3_client

        self.bucket = settings.S3_BUCKET
        self.presign_ttl = settings.S3_PRESIGNED_URL_TTL

    async def store(self, file_bytes: bytes, user_id: str, extension: str) -> str:
        """Upload to S3 and return the object key."""
        file_id = uuid.uuid4()
        key = f"{user_id}/{file_id}.{extension}"

        content_type = (
            mimetypes.types_map.get(f".{extension}") or "application/octet-stream"
        )

        # boto3 is synchronous — run in a thread so we don't block the loop.
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return key

    async def delete(self, key: str) -> None:
        """Delete object from S3."""
        await asyncio.to_thread(
            self.client.delete_object,
            Bucket=self.bucket,
            Key=key,
        )

    async def get_url(self, key: str) -> str:
        """Return a short-lived presigned URL for private object access."""
        url = await asyncio.to_thread(
            self.client.generate_presigned_url,
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=self.presign_ttl,
        )
        return url


def get_storage_service() -> StorageService:
    """Factory function to get the configured storage service."""
    backend = (settings.STORAGE_BACKEND or "local").lower()
    if backend == "supabase":
        return SupabaseStorageService()
    if backend == "s3":
        return S3StorageService()
    return LocalStorageService()
