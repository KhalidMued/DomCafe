"""add order public code

Revision ID: 20260708_0003
Revises: 20260530_0002
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = "20260708_0003"
down_revision = "20260530_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("public_code", sa.String(length=32), nullable=True))
    op.execute(
        "UPDATE orders SET public_code = substr(md5(random()::text || id::text), 1, 16) "
        "WHERE public_code IS NULL"
    )
    op.alter_column("orders", "public_code", nullable=False)
    op.create_unique_constraint("uq_orders_public_code", "orders", ["public_code"])


def downgrade() -> None:
    op.drop_constraint("uq_orders_public_code", "orders", type_="unique")
    op.drop_column("orders", "public_code")
