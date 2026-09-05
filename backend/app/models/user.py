import uuid

from sqlalchemy import Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    courses: Mapped[list["Course"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    study_materials: Mapped[list["StudyMaterial"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    study_plan_sessions: Mapped[list["StudyPlanSession"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    ai_prioritizations: Mapped[list["AIPrioritization"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_users_email", "email"),)
