"""Clear refresh tokens after switching from bcrypt to SHA-256 hashing.

Revision ID: 7a3c9e1d4f52
Revises: 511b6459cb02
Create Date: 2026-09-08 21:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "7a3c9e1d4f52"
down_revision: Union[str, Sequence[str], None] = "511b6459cb02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Old refresh tokens were hashed with bcrypt; the app now hashes with
    SHA-256 for O(1) lookup. Existing rows can never be validated again, so
    clear them. Users will re-login on their next visit.
    """
    op.execute("DELETE FROM refresh_tokens")


def downgrade() -> None:
    """Nothing to undo — the data is already gone."""
    pass
