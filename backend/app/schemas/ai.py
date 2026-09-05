"""AI service schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# Chat
class ChatRequest(BaseModel):
    material_ids: list[UUID]
    question: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": str}]


class ChatResponse(BaseModel):
    answer: str
    grounded_in_material: bool


# Summarize
class SummarizeRequest(BaseModel):
    material_id: UUID


class SummarizeResponse(BaseModel):
    summary: str


# Key Points
class KeyPointsRequest(BaseModel):
    material_id: UUID


class KeyPoint(BaseModel):
    point: str
    importance: str  # "high" | "medium" | "low"


class KeyPointsResponse(BaseModel):
    key_points: list[KeyPoint]


# Quiz
class QuizRequest(BaseModel):
    material_id: UUID


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


# Prioritization
class PrioritizedTask(BaseModel):
    task_id: UUID
    task_title: str
    priority_rank: int
    explanation: str


class PrioritizationResponse(BaseModel):
    generated_at: datetime
    prioritized_tasks: list[PrioritizedTask]


# Study plan (used internally by plan service)
class StudySession(BaseModel):
    date: str  # YYYY-MM-DD
    course_id: str | None
    task_id: str | None
    task_title: str
    duration_minutes: int
    session_type: str
    rationale: str | None = None
