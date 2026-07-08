from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import Bean, Category, Drink
from app.models.order import Order
from app.models.setting import Setting
from app.core.parsing import as_bool
from app.services.public import DEFAULT_PUBLIC_SETTINGS, STATUS_LABELS
from app.services.serializers import bean_payload, category_payload, drink_payload

PENDING_ORDER_STATUSES = ("new", "received", "preparing")


async def _orders_open(session: AsyncSession) -> bool:
    setting = await session.scalar(select(Setting.value).where(Setting.key == "orders_open"))
    return as_bool(setting, bool(DEFAULT_PUBLIC_SETTINGS["orders_open"]))


def _order_summary(order: Order) -> dict[str, object]:
    return {
        "id": str(order.id),
        "order_number": order.id,
        "guest_name": order.guest_name,
        "status": order.status,
        "status_label": STATUS_LABELS.get(order.status, STATUS_LABELS["new"]),
        "items_count": sum(item.quantity for item in order.items),
        "created_at": order.created_at.isoformat().replace("+00:00", "Z"),
    }


async def get_agent_menu(session: AsyncSession) -> dict[str, object]:
    categories = (
        await session.execute(select(Category).order_by(Category.display_order, Category.label))
    ).scalars().all()
    drinks = (
        await session.execute(
            select(Drink)
            .options(selectinload(Drink.category), selectinload(Drink.default_bean))
            .order_by(Drink.category_id, Drink.name)
        )
    ).scalars().all()
    beans = (await session.execute(select(Bean).order_by(Bean.name))).scalars().all()
    return {
        "categories": [category_payload(category) for category in categories],
        "drinks": [drink_payload(drink) for drink in drinks],
        "beans": [bean_payload(bean) for bean in beans],
    }


async def search_agent_drinks(session: AsyncSession, query: str) -> list[dict[str, object]]:
    pattern = f"%{query.strip()}%"
    drinks = (
        await session.execute(
            select(Drink)
            .options(selectinload(Drink.category), selectinload(Drink.default_bean))
            .where(Drink.name.ilike(pattern))
            .order_by(Drink.name)
            .limit(25)
        )
    ).scalars().all()
    return [drink_payload(drink) for drink in drinks]


async def list_agent_beans(session: AsyncSession) -> list[dict[str, object]]:
    beans = (await session.execute(select(Bean).order_by(Bean.name))).scalars().all()
    return [bean_payload(bean) for bean in beans]


async def search_agent_beans(session: AsyncSession, query: str) -> list[dict[str, object]]:
    pattern = f"%{query.strip()}%"
    beans = (
        await session.execute(
            select(Bean)
            .where(Bean.name.ilike(pattern) | Bean.origin.ilike(pattern))
            .order_by(Bean.name)
            .limit(25)
        )
    ).scalars().all()
    return [bean_payload(bean) for bean in beans]

async def get_agent_status(session: AsyncSession) -> dict[str, object]:
    pending_count = await session.scalar(
        select(func.count()).select_from(Order).where(Order.status.in_(PENDING_ORDER_STATUSES))
    )
    return {
        "status": "ok",
        "orders_open": await _orders_open(session),
        "pending_orders_count": int(pending_count or 0),
    }


async def list_pending_orders(session: AsyncSession) -> list[dict[str, object]]:
    orders = (
        await session.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.status.in_(PENDING_ORDER_STATUSES))
            .order_by(Order.created_at.asc(), Order.id.asc())
            .limit(50)
        )
    ).scalars().unique().all()
    return [_order_summary(order) for order in orders]
