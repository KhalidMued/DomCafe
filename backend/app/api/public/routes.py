from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re

from app.db.session import get_session
from app.db.session import AsyncSessionLocal
from app.models.order import Order
from app.core.errors import GuestApiError
from app.services.order_events import guest_channel, order_event_response
from app.schemas.public import (
    OrderCreate,
    OrderCreateResponse,
    OrderStatusResponse,
    PublicCategoryResponse,
    PublicSettingsResponse,
)
from app.security.rate_limit import enforce_order_create_rate_limit
from app.services.public import (
    create_guest_order,
    get_guest_order_status,
    get_public_menu,
    get_public_settings,
)

router = APIRouter(tags=["public"])


@router.get("/settings/public", response_model=PublicSettingsResponse)
async def public_settings(session: AsyncSession = Depends(get_session)):
    return await get_public_settings(session)


@router.get("/menu", response_model=list[PublicCategoryResponse])
async def public_menu(session: AsyncSession = Depends(get_session)):
    return await get_public_menu(session)


@router.post(
    "/orders",
    response_model=OrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    payload: OrderCreate,
    _rate_limit: None = Depends(enforce_order_create_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    return await create_guest_order(session, payload)


@router.get("/orders/{order_code}", response_model=OrderStatusResponse)
async def order_status(order_code: str, session: AsyncSession = Depends(get_session)):
    return await get_guest_order_status(session, order_code)


@router.get("/orders/{order_code}/events")
async def order_events(order_code: str):
    if not re.fullmatch(r"[A-Za-z0-9_-]{16}", order_code) or order_code.isdigit():
        raise GuestApiError(404, "ORDER_NOT_FOUND", "We could not find that order.")
    # Explicit scope: never retain a DB dependency during a streaming response.
    async with AsyncSessionLocal() as session:
        exists = await session.scalar(select(Order.id).where(Order.public_code == order_code))
    if exists is None:
        raise GuestApiError(404, "ORDER_NOT_FOUND", "We could not find that order.")
    return await order_event_response(guest_channel(order_code), "order-changed")
