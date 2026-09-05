"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # users
    # -------------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # -------------------------------------------------------------------------
    # refresh_tokens
    # -------------------------------------------------------------------------
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("idx_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index(
        "idx_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"]
    )

    # -------------------------------------------------------------------------
    # courses
    # -------------------------------------------------------------------------
    op.create_table(
        "courses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "color",
            sa.String(7),
            server_default=sa.text("'#6366f1'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_courses_user_id", "courses", ["user_id"])

    # -------------------------------------------------------------------------
    # tasks
    # -------------------------------------------------------------------------
    op.create_table(
        "tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "task_type",
            sa.String(20),
            server_default=sa.text("'task'"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(20),
            server_default=sa.text("'not_started'"),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.String(10),
            server_default=sa.text("'medium'"),
            nullable=False,
        ),
        sa.Column("difficulty", sa.SmallInteger(), nullable=True),
        sa.Column("estimated_hours", sa.Numeric(5, 2), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("difficulty BETWEEN 1 AND 5", name="tasks_difficulty_check"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["course_id"], ["courses.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_tasks_user_id", "tasks", ["user_id"])
    op.create_index("idx_tasks_course_id", "tasks", ["course_id"])
    op.create_index("idx_tasks_status", "tasks", ["status"])
    op.create_index("idx_tasks_deadline", "tasks", ["deadline"])
    op.create_index("idx_tasks_user_status", "tasks", ["user_id", "status"])

    # -------------------------------------------------------------------------
    # study_materials
    # -------------------------------------------------------------------------
    op.create_table(
        "study_materials",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source_type", sa.String(20), nullable=False),
        sa.Column("original_filename", sa.String(500), nullable=True),
        sa.Column("storage_key", sa.String(1000), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column(
            "extraction_warning",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["course_id"], ["courses.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_materials_user_id", "study_materials", ["user_id"])
    op.create_index("idx_materials_course_id", "study_materials", ["course_id"])

    # -------------------------------------------------------------------------
    # study_plan_sessions
    # -------------------------------------------------------------------------
    op.create_table(
        "study_plan_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("duration_minutes", sa.SmallInteger(), nullable=False),
        sa.Column("session_type", sa.String(30), nullable=False),
        sa.Column("task_title", sa.String(500), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column(
            "is_completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["course_id"], ["courses.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["task_id"], ["tasks.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_plan_user_id", "study_plan_sessions", ["user_id"])
    op.create_index(
        "idx_plan_user_date", "study_plan_sessions", ["user_id", "session_date"]
    )

    # -------------------------------------------------------------------------
    # ai_prioritizations
    # -------------------------------------------------------------------------
    op.create_table(
        "ai_prioritizations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("results", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_prioritizations_user_id", "ai_prioritizations", ["user_id"]
    )


def downgrade() -> None:
    op.drop_table("ai_prioritizations")
    op.drop_table("study_plan_sessions")
    op.drop_table("study_materials")
    op.drop_table("tasks")
    op.drop_table("courses")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
