import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models.order import Order
from app.models.setting import Setting

logger = logging.getLogger(__name__)


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _status_label(status: str) -> str:
    return {
        "new": "New",
        "received": "Received",
        "preparing": "Preparing",
        "ready": "Ready",
        "cancelled": "Cancelled",
    }.get(status, status.title())


async def _notifications_enabled(session: AsyncSession) -> bool:
    settings = get_settings()
    setting = await session.scalar(
        select(Setting.value).where(Setting.key == "discord_notifications_enabled")
    )
    return _as_bool(setting, settings.discord_notifications_enabled)


async def build_order_notification_message(session: AsyncSession, order: Order) -> str:
    if not order.items:
        order = await session.get(Order, order.id, options=[selectinload(Order.items)])
    lines = [
        "☕ New DŌM order",
        "",
        f"Order #{order.id}",
        f"Guest: {order.guest_name}",
        "",
        "Items:",
    ]
    for item in order.items:
        lines.append(f"- {item.quantity}x {item.drink_name_snapshot}")
        if item.temperature:
            lines.append(f"  Temperature: {item.temperature}")
        if item.milk:
            lines.append(f"  Milk: {item.milk}")
        if item.item_note:
            lines.append(f"  Note: {item.item_note}")
    lines.extend(["", f"Status: {_status_label(order.status)}"])
    return "\n".join(lines)


async def notify_new_order_if_enabled(order_id: int) -> None:
    settings = get_settings()
    if not settings.discord_webhook_url:
        return

    try:
        async with AsyncSessionLocal() as session:
            if not await _notifications_enabled(session):
                return
            order = await session.get(Order, order_id, options=[selectinload(Order.items)])
            if order is None:
                return
            message = await build_order_notification_message(session, order)
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(settings.discord_webhook_url, json={"content": message})
            response.raise_for_status()
    except Exception:
        logger.exception("Discord order notification failed for order_id=%s", order_id)
