from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import GuestApiError
from app.models.menu import Category, Drink
from app.models.order import Order, OrderItem
from app.models.setting import Setting
from app.schemas.public import OrderCreate
from app.services.discord import notify_new_order_if_enabled

DEFAULT_PUBLIC_SETTINGS = {
    "cafe_name": "DŌM",
    "welcome_message": "Welcome to DŌM. Take your time.",
    "orders_open": True,
}

STATUS_LABELS = {
    "new": "Your order was sent to the bar.",
    "received": "Your order was received.",
    "preparing": "Your drink is being prepared.",
    "ready": "Your drink is ready — we’ll bring it to you shortly.",
    "cancelled": "This order was cancelled. Please check with the coffee bar.",
}


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


async def get_public_settings(session: AsyncSession) -> dict[str, object]:
    rows = (
        await session.execute(
            select(Setting).where(
                Setting.key.in_(["cafe_name", "welcome_message", "orders_open"])
            )
        )
    ).scalars()
    stored = {row.key: row.value for row in rows}
    return {
        "cafe_name": stored.get("cafe_name") or DEFAULT_PUBLIC_SETTINGS["cafe_name"],
        "welcome_message": stored.get("welcome_message")
        or DEFAULT_PUBLIC_SETTINGS["welcome_message"],
        "orders_open": _as_bool(
            stored.get("orders_open"), bool(DEFAULT_PUBLIC_SETTINGS["orders_open"])
        ),
    }


async def get_public_menu(session: AsyncSession) -> list[dict[str, object]]:
    categories = (
        await session.execute(
            select(Category)
            .where(Category.is_available.is_(True))
            .options(
                selectinload(Category.drinks).selectinload(Drink.default_bean),
            )
            .order_by(Category.display_order, Category.label)
        )
    ).scalars().unique().all()

    menu: list[dict[str, object]] = []
    for category in categories:
        drinks = sorted(
            [drink for drink in category.drinks if drink.is_available],
            key=lambda drink: (drink.estimated_time_minutes, drink.name),
        )
        menu.append(
            {
                "id": category.id,
                "name": category.label,
                "description": category.description,
                "drinks": [_drink_to_public(drink) for drink in drinks],
            }
        )
    return menu


def _drink_to_public(drink: Drink) -> dict[str, object]:
    bean = drink.default_bean
    return {
        "id": drink.id,
        "name": drink.name,
        "description": drink.description,
        "ingredients": drink.ingredients,
        "bean": None
        if bean is None
        else {
            "id": bean.id,
            "name": bean.name,
            "origin": bean.origin,
            "tasting_notes": bean.tasting_notes,
        },
        "photo_url": drink.photo_url,
        "available": drink.is_available,
        "temperature_options": drink.temperature_options,
        "milk_options": drink.milk_options,
        "estimated_time_minutes": drink.estimated_time_minutes,
    }


async def create_guest_order(session: AsyncSession, payload: OrderCreate) -> dict[str, object]:
    settings = await get_public_settings(session)
    if settings["orders_open"] is not True:
        raise GuestApiError(
            409,
            "ORDERS_CLOSED",
            "The coffee bar is not taking orders right now. Please check again shortly.",
        )

    order = Order(
        guest_name=payload.guest_name.strip(),
        guest_note=payload.guest_note.strip() if payload.guest_note else None,
        status="new",
    )
    session.add(order)
    await session.flush()

    for item in payload.items:
        drink = await session.get(
            Drink,
            item.drink_id,
            options=[selectinload(Drink.category), selectinload(Drink.default_bean)],
        )
        if drink is None or not drink.is_available or not drink.category.is_available:
            raise GuestApiError(
                400,
                "DRINK_UNAVAILABLE",
                "Sorry, this drink is currently unavailable. Please choose another one.",
            )
        if item.temperature and item.temperature not in drink.temperature_options:
            raise GuestApiError(
                400,
                "INVALID_TEMPERATURE",
                "Please choose an available temperature for this drink.",
            )
        if item.milk_option and item.milk_option not in drink.milk_options:
            raise GuestApiError(
                400,
                "INVALID_MILK_OPTION",
                "Please choose an available milk option for this drink.",
            )

        session.add(
            OrderItem(
                order_id=order.id,
                drink_id=drink.id,
                drink_name_snapshot=drink.name,
                category_name_snapshot=drink.category.label,
                bean_name_snapshot=drink.default_bean.name if drink.default_bean else None,
                photo_url_snapshot=drink.photo_url,
                quantity=item.quantity,
                temperature=item.temperature,
                milk=item.milk_option,
                item_note=item.item_note.strip() if item.item_note else None,
            )
        )

    await session.commit()
    await notify_new_order_if_enabled(order.id)
    return {
        "order_id": str(order.id),
        "order_number": order.id,
        "status": order.status,
        "message": STATUS_LABELS[order.status],
    }


async def get_guest_order_status(session: AsyncSession, order_id: int) -> dict[str, object]:
    order = await session.get(Order, order_id, options=[selectinload(Order.items)])
    if order is None:
        raise GuestApiError(404, "ORDER_NOT_FOUND", "We could not find that order.")

    return {
        "id": str(order.id),
        "order_number": order.id,
        "guest_name": order.guest_name,
        "status": order.status,
        "status_label": STATUS_LABELS.get(order.status, STATUS_LABELS["new"]),
        "items": [
            {
                "drink_name": item.drink_name_snapshot,
                "quantity": item.quantity,
                "temperature": item.temperature,
                "milk_option": item.milk,
                "item_note": item.item_note,
                "bean_name": item.bean_name_snapshot,
                "photo_url": item.photo_url_snapshot,
            }
            for item in order.items
        ],
        "created_at": order.created_at.isoformat().replace("+00:00", "Z"),
    }
