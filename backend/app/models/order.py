from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    guest_name: Mapped[str] = mapped_column(String(120), nullable=False)
    guest_note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="new", index=True)
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    preparing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(TimestampMixin, Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    drink_id: Mapped[str] = mapped_column(ForeignKey("drinks.id"), nullable=False, index=True)
    drink_name_snapshot: Mapped[str] = mapped_column(String(160), nullable=False)
    category_name_snapshot: Mapped[str | None] = mapped_column(String(120))
    bean_name_snapshot: Mapped[str | None] = mapped_column(String(160))
    photo_url_snapshot: Mapped[str | None] = mapped_column(String(300))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    temperature: Mapped[str | None] = mapped_column(String(20))
    milk: Mapped[str | None] = mapped_column(String(40))
    item_note: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship(back_populates="items")
