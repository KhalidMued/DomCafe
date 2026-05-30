from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.public import (
    OrderCreate,
    OrderCreateResponse,
    OrderStatusResponse,
    PublicCategoryResponse,
    PublicSettingsResponse,
)
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
async def create_order(payload: OrderCreate, session: AsyncSession = Depends(get_session)):
    return await create_guest_order(session, payload)


@router.get("/orders/{order_id}", response_model=OrderStatusResponse)
async def order_status(order_id: int, session: AsyncSession = Depends(get_session)):
    return await get_guest_order_status(session, order_id)
