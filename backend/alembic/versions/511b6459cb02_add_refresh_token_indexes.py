"""add_refresh_token_indexes

Revision ID: 511b6459cb02
Revises: 0001
Create Date: 2026-09-06 00:08:23.157416

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '511b6459cb02'
down_revision: Union[str, Sequence[str], None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add indexes for refresh_tokens table to optimize queries
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'], unique=False)
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove indexes
    op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
