"""add public guest api fields

Revision ID: 20260530_0002
Revises: 20260530_0001
Create Date: 2026-05-30
"""
from alembic import op
import sqlalchemy as sa

revision = "20260530_0002"
down_revision = "20260530_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("key", name="pk_settings"),
    )
    op.bulk_insert(
        sa.table(
            "settings",
            sa.column("key", sa.String),
            sa.column("value", sa.Text),
        ),
        [
            {"key": "cafe_name", "value": "DŌM"},
            {"key": "welcome_message", "value": "Welcome to DŌM. Take your time."},
            {"key": "orders_open", "value": "true"},
        ],
    )
    op.add_column("orders", sa.Column("guest_note", sa.Text(), nullable=True))
    op.add_column(
        "order_items",
        sa.Column("drink_name_snapshot", sa.String(length=160), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column("category_name_snapshot", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column("bean_name_snapshot", sa.String(length=160), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column("photo_url_snapshot", sa.String(length=300), nullable=True),
    )
    op.add_column("order_items", sa.Column("item_note", sa.Text(), nullable=True))
    op.execute("update order_items set drink_name_snapshot = drink_id where drink_name_snapshot is null")
    op.alter_column("order_items", "drink_name_snapshot", nullable=False)


def downgrade() -> None:
    op.drop_column("order_items", "item_note")
    op.drop_column("order_items", "photo_url_snapshot")
    op.drop_column("order_items", "bean_name_snapshot")
    op.drop_column("order_items", "category_name_snapshot")
    op.drop_column("order_items", "drink_name_snapshot")
    op.drop_column("orders", "guest_note")
    op.drop_table("settings")
