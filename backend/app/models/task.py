import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Task(Base, TimestampMixin):
    """
    Covers both regular tasks and exams (task_type = 'exam').
    task_type: 'task' | 'assignment' | 'exam' | 'reading' | 'project'
    status:    'not_started' | 'in_progress' | 'completed'
    priority:  'low' | 'medium' | 'high'
    """

    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'task'"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'not_started'"
    )
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default="'medium'"
    )
    difficulty: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="tasks")  # noqa: F821
    course: Mapped["Course | None"] = relationship(back_populates="tasks")  # noqa: F821
    study_plan_sessions: Mapped[list["StudyPlanSession"]] = relationship(  # noqa: F821
        back_populates="task",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("idx_tasks_user_id", "user_id"),
        Index("idx_tasks_course_id", "course_id"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_deadline", "deadline"),
        Index("idx_tasks_user_status", "user_id", "status"),
    )
