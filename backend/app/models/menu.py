from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    label_ar: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    accent_color: Mapped[str | None] = mapped_column(String(40))
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    drinks: Mapped[list["Drink"]] = relationship(back_populates="category")


class Bean(TimestampMixin, Base):
    __tablename__ = "beans"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    name_ar: Mapped[str | None] = mapped_column(String(160))
    origin: Mapped[str | None] = mapped_column(String(160))
    process: Mapped[str | None] = mapped_column(String(120))
    tasting_notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    drinks: Mapped[list["Drink"]] = relationship(back_populates="default_bean")


class Drink(TimestampMixin, Base):
    __tablename__ = "drinks"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    default_bean_id: Mapped[str | None] = mapped_column(ForeignKey("beans.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    name_ar: Mapped[str | None] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    temperature_options: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    milk_options: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    ingredients: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    estimated_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    photo_url: Mapped[str] = mapped_column(String(300), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    category: Mapped[Category] = relationship(back_populates="drinks")
    default_bean: Mapped[Bean | None] = relationship(back_populates="drinks")
