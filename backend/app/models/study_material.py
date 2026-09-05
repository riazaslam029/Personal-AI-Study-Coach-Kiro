import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class StudyMaterial(Base, TimestampMixin):
    """
    source_type: 'pdf' | 'txt' | 'markdown' | 'pasted_text'
    storage_key is null for pasted text.
    extracted_text is stored up to 50k chars; truncation happens at AI query time.
    extraction_warning is True if PDF had no extractable text.
    """

    __tablename__ = "study_materials"

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
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extraction_warning: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="study_materials")  # noqa: F821
    course: Mapped["Course | None"] = relationship(back_populates="study_materials")  # noqa: F821

    __table_args__ = (
        Index("idx_materials_user_id", "user_id"),
        Index("idx_materials_course_id", "course_id"),
    )
