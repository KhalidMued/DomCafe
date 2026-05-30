from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import Bean, Drink
from app.models.setting import Setting
from app.services.public import _as_bool, DEFAULT_PUBLIC_SETTINGS


async def get_menu_management_summary(session: AsyncSession) -> dict[str, object]:
    orders_open = await _get_orders_open(session)
    drinks = (
        await session.execute(
            select(Drink)
            .options(selectinload(Drink.category), selectinload(Drink.default_bean))
            .order_by(Drink.category_id, Drink.name)
        )
    ).scalars().all()
    beans = (await session.execute(select(Bean).order_by(Bean.name))).scalars().all()
    return {
        "orders_open": orders_open,
        "drinks": [
            {
                "id": drink.id,
                "name": drink.name,
                "category_name": drink.category.label,
                "bean_name": drink.default_bean.name if drink.default_bean else None,
                "photo_url": drink.photo_url,
                "is_available": drink.is_available,
            }
            for drink in drinks
        ],
        "beans": [
            {
                "id": bean.id,
                "name": bean.name,
                "origin": bean.origin,
                "is_available": bean.is_available,
            }
            for bean in beans
        ],
    }


async def set_drink_availability(
    session: AsyncSession, drink_id: str, is_available: bool
) -> dict[str, object]:
    drink = await session.get(Drink, drink_id)
    if drink is None:
        raise HTTPException(status_code=404, detail="Drink not found.")
    drink.is_available = is_available
    await session.commit()
    return {"id": drink.id, "is_available": drink.is_available}


async def set_bean_availability(
    session: AsyncSession, bean_id: str, is_available: bool
) -> dict[str, object]:
    bean = await session.get(Bean, bean_id)
    if bean is None:
        raise HTTPException(status_code=404, detail="Bean not found.")
    bean.is_available = is_available
    await session.commit()
    return {"id": bean.id, "is_available": bean.is_available}


async def set_orders_open(session: AsyncSession, orders_open: bool) -> dict[str, bool]:
    setting = await session.get(Setting, "orders_open")
    if setting is None:
        setting = Setting(key="orders_open", value=str(orders_open).lower())
        session.add(setting)
    else:
        setting.value = str(orders_open).lower()
    await session.commit()
    return {"orders_open": orders_open}


async def _get_orders_open(session: AsyncSession) -> bool:
    setting = await session.get(Setting, "orders_open")
    return _as_bool(
        setting.value if setting else None,
        bool(DEFAULT_PUBLIC_SETTINGS["orders_open"]),
    )
