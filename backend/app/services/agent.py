from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order
from app.models.setting import Setting
from app.services.public import DEFAULT_PUBLIC_SETTINGS, STATUS_LABELS

PENDING_ORDER_STATUSES = ("new", "received", "preparing")


def _as_bool(value: str | None, fallback: bool) -> bool:
    if value is None:
        return fallback
    return value.lower() in {"1", "true", "yes", "on"}


async def _orders_open(session: AsyncSession) -> bool:
    setting = await session.scalar(select(Setting.value).where(Setting.key == "orders_open"))
    return _as_bool(setting, bool(DEFAULT_PUBLIC_SETTINGS["orders_open"]))


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
