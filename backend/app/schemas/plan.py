"""Study plan schemas."""
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, field_validator


class GeneratePlanRequest(BaseModel):
    available_hours_per_day: dict[str, float] | float
    start_date: date
    end_date: date

    @field_validator("available_hours_per_day")
    @classmethod
    def validate_hours(cls, v: dict[str, float] | float) -> dict[str, float] | float:
        if isinstance(v, dict):
            # Validate each day's hours
            for day, hours in v.items():
                if hours < 0 or hours > 16:
                    raise ValueError(f"Hours for {day} must be between 0 and 16")
            return v
        else:
            # Single value for all days
            if v < 0.5 or v > 16:
                raise ValueError("Available hours must be between 0.5 and 16")
            return v


class PlanSessionResponse(BaseModel):
    id: UUID
    session_date: date
    course_id: UUID | None
    course_name: str | None
    course_color: str | None
    task_id: UUID | None
    task_title: str
    duration_minutes: int
    session_type: str
    rationale: str | None
    is_completed: bool
    generated_at: datetime

    model_config = {"from_attributes": True}


class PlanResponse(BaseModel):
    generated_at: datetime
    session_count: int
    sessions: list[PlanSessionResponse]


class PlanByDateResponse(BaseModel):
    generated_at: datetime
    sessions_by_date: dict[str, list[PlanSessionResponse]]
