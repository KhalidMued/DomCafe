from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Bean, Drink
from app.models.order import Order
from app.models.setting import Setting


async def _count_scalar(session: AsyncSession, statement) -> int:
    return int(await session.scalar(statement) or 0)


async def get_dashboard_summary(session: AsyncSession) -> dict[str, int | bool]:
    orders_open_value = await session.scalar(select(Setting.value).where(Setting.key == "orders_open"))
    orders_open = str(orders_open_value).lower() != "false"

    return {
        "new_orders_count": await _count_scalar(session, select(func.count()).select_from(Order).where(Order.status == "new")),
        "preparing_orders_count": await _count_scalar(session, select(func.count()).select_from(Order).where(Order.status == "preparing")),
        "ready_orders_count": await _count_scalar(session, select(func.count()).select_from(Order).where(Order.status == "ready")),
        "orders_open": orders_open,
        "available_drinks_count": await _count_scalar(session, select(func.count()).select_from(Drink).where(Drink.is_available.is_(True))),
        "available_beans_count": await _count_scalar(session, select(func.count()).select_from(Bean).where(Bean.is_available.is_(True))),
    }
