"""Task schemas."""
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, field_validator


class TaskCreate(BaseModel):
    course_id: UUID | None = None
    title: str
    description: str | None = None
    task_type: str = "task"
    priority: str = "medium"
    difficulty: int | None = None
    estimated_hours: float | None = None
    deadline: date | None = None

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Difficulty must be between 1 and 5")
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

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Difficulty must be between 1 and 5")
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
