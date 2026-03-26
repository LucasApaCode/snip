"""Add device_type and browser to visits

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("visits", sa.Column("device_type", sa.String(20), nullable=True))
    op.add_column("visits", sa.Column("browser", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("visits", "browser")
    op.drop_column("visits", "device_type")
