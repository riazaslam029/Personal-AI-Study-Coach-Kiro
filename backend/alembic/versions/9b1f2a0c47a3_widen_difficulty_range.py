"""Widen tasks.difficulty CHECK constraint from 1..5 to 1..10.

The frontend form uses a 1-10 difficulty scale ('1 easy' to '10 very hard').
The initial schema pinned this at 1-5, which made every task with a slider
value >= 6 fail with an IntegrityError. This migration keeps the safety
of the CHECK constraint but matches it to the UI.

Revision ID: 9b1f2a0c47a3
Revises: 7a3c9e1d4f52
Create Date: 2026-09-09 20:15:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "9b1f2a0c47a3"
down_revision: Union[str, Sequence[str], None] = "7a3c9e1d4f52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("tasks_difficulty_check", "tasks", type_="check")
    op.create_check_constraint(
        "tasks_difficulty_check",
        "tasks",
        "difficulty BETWEEN 1 AND 10",
    )


def downgrade() -> None:
    op.drop_constraint("tasks_difficulty_check", "tasks", type_="check")
    op.create_check_constraint(
        "tasks_difficulty_check",
        "tasks",
        "difficulty BETWEEN 1 AND 5",
    )
