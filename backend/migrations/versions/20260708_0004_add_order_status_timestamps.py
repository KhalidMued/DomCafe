"""add order status transition timestamps

Revision ID: 20260708_0004
Revises: 20260708_0003
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = "20260708_0004"
down_revision = "20260708_0003"
branch_labels = None
depends_on = None

_COLUMNS = ("received_at", "preparing_at", "ready_at", "cancelled_at")


def upgrade() -> None:
    for column in _COLUMNS:
        op.add_column("orders", sa.Column(column, sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for column in reversed(_COLUMNS):
        op.drop_column("orders", column)
