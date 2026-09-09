"""Task schemas."""
from datetime import datetime, date
from typing import Any
from uuid import UUID

from pydantic import BaseModel, field_validator


def _empty_str_to_none(v: Any) -> Any:
    """Pydantic 'before' hook: turn blank strings into None so the field
    can validate against its Optional type. Frontend forms often submit
    "" for unselected UUID/date fields; without this coercion Pydantic
    rejects the request with a 422 that the user cannot see.
    """
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


class TaskCreate(BaseModel):
    course_id: UUID | None = None
    title: str
    description: str | None = None
    task_type: str = "task"
    priority: str = "medium"
    difficulty: int | None = None
    estimated_hours: float | None = None
    deadline: date | None = None

    # Coerce "" -> None for the fields the frontend leaves blank.
    _blank_to_none = field_validator(
        "course_id", "deadline", "description", "estimated_hours",
        "difficulty",
        mode="before",
    )(_empty_str_to_none)

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: int | None) -> int | None:
        # Frontend uses a 1-10 scale ("1 easy" to "10 very hard").
        if v is not None and (v < 1 or v > 10):
            raise ValueError("Difficulty must be between 1 and 10")
        return v

    @field_validator("estimated_hours")
    @classmethod
    def validate_hours(cls, v: float | None) -> float | None:
        if v is not None and (v < 0.25 or v > 100):
            raise ValueError("Estimated hours must be between 0.25 and 100")
        return v


class TaskUpdate(BaseModel):
    course_id: UUID | None = None
    title: str | None = None
    description: str | None = None
    task_type: str | None = None
    status: str | None = None
    priority: str | None = None
    difficulty: int | None = None
    estimated_hours: float | None = None
    deadline: date | None = None

    _blank_to_none = field_validator(
        "course_id", "deadline", "description", "estimated_hours",
        "difficulty",
        mode="before",
    )(_empty_str_to_none)

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 10):
            raise ValueError("Difficulty must be between 1 and 10")
        return v

    @field_validator("estimated_hours")
    @classmethod
    def validate_hours(cls, v: float | None) -> float | None:
        if v is not None and (v < 0.25 or v > 100):
            raise ValueError("Estimated hours must be between 0.25 and 100")
        return v


class TaskResponse(BaseModel):
    id: UUID
    course_id: UUID | None
    course_name: str | None
    course_color: str | None
    title: str
    description: str | None
    task_type: str
    status: str
    priority: str
    difficulty: int | None
    estimated_hours: float | None
    deadline: date | None
    completed_at: datetime | None
    is_overdue: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
