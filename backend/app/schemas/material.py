"""Study material schemas."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, field_validator


def _empty_str_to_none(v: Any) -> Any:
    """Turn blank strings into None so optional fields validate correctly
    when the frontend submits "" for unselected UUID/date fields.
    """
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


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

    _blank_to_none = field_validator("course_id", mode="before")(_empty_str_to_none)
