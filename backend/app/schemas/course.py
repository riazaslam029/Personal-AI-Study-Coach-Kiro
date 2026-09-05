"""Course schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator
import re


class CourseCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = "#6366f1"

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("Color must be a valid hex color (#RRGGBB)")
        return v


class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("Color must be a valid hex color (#RRGGBB)")
        return v


class CourseResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    color: str
    task_count: int
    completed_task_count: int
    material_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CourseStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    estimated_hours_total: float
    estimated_hours_completed: float
