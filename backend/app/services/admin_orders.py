from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.schemas.admin import OrderStatus
from app.services.public import STATUS_LABELS


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
