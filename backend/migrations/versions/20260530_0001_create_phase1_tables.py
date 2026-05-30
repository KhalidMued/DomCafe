"""create phase1 tables

Revision ID: 20260530_0001
Revises: 
Create Date: 2026-05-30
"""
from alembic import op
import sqlalchemy as sa

revision = "20260530_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("label_ar", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("accent_color", sa.String(length=40), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_categories"),
    )
    op.create_table(
        "beans",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("name_ar", sa.String(length=160), nullable=True),
        sa.Column("origin", sa.String(length=160), nullable=True),
        sa.Column("process", sa.String(length=120), nullable=True),
        sa.Column("tasting_notes", sa.JSON(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_beans"),
    )
    op.create_table(
        "admin_users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_admin_users"),
    )
    op.create_index("ix_admin_users_username", "admin_users", ["username"], unique=True)
    op.create_table(
        "drinks",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("category_id", sa.String(length=80), nullable=False),
        sa.Column("default_bean_id", sa.String(length=80), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("name_ar", sa.String(length=160), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("temperature_options", sa.JSON(), nullable=False),
        sa.Column("milk_options", sa.JSON(), nullable=False),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("estimated_time_minutes", sa.Integer(), nullable=False),
        sa.Column("photo_url", sa.String(length=300), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], name="fk_drinks_category_id_categories"),
        sa.ForeignKeyConstraint(["default_bean_id"], ["beans.id"], name="fk_drinks_default_bean_id_beans"),
        sa.PrimaryKeyConstraint("id", name="pk_drinks"),
    )
    op.create_index("ix_drinks_category_id", "drinks", ["category_id"])
    op.create_index("ix_drinks_default_bean_id", "drinks", ["default_bean_id"])
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("guest_name", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_orders"),
    )
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("drink_id", sa.String(length=80), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("temperature", sa.String(length=20), nullable=True),
        sa.Column("milk", sa.String(length=40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["drink_id"], ["drinks.id"], name="fk_order_items_drink_id_drinks"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name="fk_order_items_order_id_orders"),
        sa.PrimaryKeyConstraint("id", name="pk_order_items"),
    )
    op.create_index("ix_order_items_drink_id", "order_items", ["drink_id"])
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_index("ix_order_items_drink_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_drinks_default_bean_id", table_name="drinks")
    op.drop_index("ix_drinks_category_id", table_name="drinks")
    op.drop_table("drinks")
    op.drop_index("ix_admin_users_username", table_name="admin_users")
    op.drop_table("admin_users")
    op.drop_table("beans")
    op.drop_table("categories")
