"""Storage service abstraction for local and cloud storage."""
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


def get_storage_service() -> StorageService:
    """Factory function to get the configured storage service."""
    if settings.STORAGE_BACKEND == "supabase":
        return SupabaseStorageService()
    else:
        return LocalStorageService()
