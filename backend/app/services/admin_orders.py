from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order
from app.schemas.admin import OrderStatus
from app.services.public import STATUS_LABELS


async def list_recent_orders(session: AsyncSession) -> list[dict[str, object]]:
    orders = (
        await session.execute(
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc(), Order.id.desc())
            .limit(50)
        )
    ).scalars().unique().all()
    return [
        {
            "id": str(order.id),
            "order_number": order.id,
            "guest_name": order.guest_name,
            "status": order.status,
            "status_label": STATUS_LABELS.get(order.status, STATUS_LABELS["new"]),
            "items_count": sum(item.quantity for item in order.items),
            "created_at": order.created_at.isoformat().replace("+00:00", "Z"),
        }
        for order in orders
    ]


async def update_order_status(
    session: AsyncSession, order_id: int, order_status: OrderStatus
) -> dict[str, object]:
    order = await session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.status = order_status
    await session.commit()
    return {
        "id": str(order.id),
        "order_number": order.id,
        "status": order.status,
        "status_label": STATUS_LABELS[order.status],
    }
