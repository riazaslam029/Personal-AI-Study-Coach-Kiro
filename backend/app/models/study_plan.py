import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class StudyPlanSession(Base):
    """
    Stores the current active study plan — one row per scheduled session block.
    Replaced in full on regeneration.
    session_type: 'study' | 'revision' | 'exam_prep' | 'assignment'
    task_id may be null for generic revision sessions.
    task_title is denormalized so display works even if the source task is deleted.
    """

    __tablename__ = "study_plan_sessions"

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
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    session_type: Mapped[str] = mapped_column(String(30), nullable=False)
    task_title: Mapped[str] = mapped_column(String(500), nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="study_plan_sessions")  # noqa: F821
    course: Mapped["Course | None"] = relationship(back_populates="study_plan_sessions")  # noqa: F821
    task: Mapped["Task | None"] = relationship(back_populates="study_plan_sessions")  # noqa: F821

    __table_args__ = (
        Index("idx_plan_user_id", "user_id"),
        Index("idx_plan_user_date", "user_id", "session_date"),
    )
