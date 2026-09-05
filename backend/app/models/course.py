import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(
        String(7), nullable=False, server_default="'#6366f1'"
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="courses")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="course",
        passive_deletes=True,
    )
    study_materials: Mapped[list["StudyMaterial"]] = relationship(  # noqa: F821
        back_populates="course",
        passive_deletes=True,
    )
    study_plan_sessions: Mapped[list["StudyPlanSession"]] = relationship(  # noqa: F821
        back_populates="course",
        passive_deletes=True,
    )

    __table_args__ = (Index("idx_courses_user_id", "user_id"),)
