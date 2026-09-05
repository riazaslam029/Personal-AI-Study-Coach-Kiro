import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AIPrioritization(Base):
    """
    Stores the latest AI task prioritization result for the user.
    results is a JSONB array: [{task_id, priority_rank, explanation}]
    Only the latest result per user is kept; the old row is deleted on regeneration.
    """

    __tablename__ = "ai_prioritizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    results: Mapped[list] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="ai_prioritizations")  # noqa: F821

    __table_args__ = (Index("idx_prioritizations_user_id", "user_id"),)
