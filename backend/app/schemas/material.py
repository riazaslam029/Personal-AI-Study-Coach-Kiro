"""Study material schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MaterialResponse(BaseModel):
    id: UUID
    course_id: UUID | None
    title: str
    source_type: str
    original_filename: str | None
    file_size_bytes: int | None
    extraction_warning: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MaterialDetailResponse(MaterialResponse):
    extracted_text: str


class PasteTextRequest(BaseModel):
    title: str
    content: str
    course_id: UUID | None = None
