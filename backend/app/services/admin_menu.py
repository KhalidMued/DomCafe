from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import Bean, Drink
from app.models.setting import Setting
from app.schemas.admin import AdminBeanUpdate, AdminDrinkUpdate, AdminSettingsUpdate
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
        "drinks": [_drink_payload(drink) for drink in drinks],
        "beans": [_bean_payload(bean) for bean in beans],
    }


async def update_bean_details(
    session: AsyncSession, bean_id: str, payload: AdminBeanUpdate
) -> dict[str, object]:
    bean = await session.get(Bean, bean_id)
    if bean is None:
        raise HTTPException(status_code=404, detail="Bean not found.")
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(bean, field, value)
    await session.commit()
    await session.refresh(bean)
    return _bean_payload(bean)


async def get_admin_settings(session: AsyncSession) -> dict[str, object]:
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
        "welcome_message": stored.get("welcome_message") or DEFAULT_PUBLIC_SETTINGS["welcome_message"],
        "orders_open": _as_bool(stored.get("orders_open"), bool(DEFAULT_PUBLIC_SETTINGS["orders_open"])),
    }


async def update_admin_settings(
    session: AsyncSession, payload: AdminSettingsUpdate
) -> dict[str, object]:
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        stored_value = str(value).lower() if isinstance(value, bool) else value
        setting = await session.get(Setting, key)
        if setting is None:
            session.add(Setting(key=key, value=stored_value))
        else:
            setting.value = stored_value
    await session.commit()
    return await get_admin_settings(session)


async def update_drink_details(
    session: AsyncSession, drink_id: str, payload: AdminDrinkUpdate
) -> dict[str, object]:
    drink = await session.get(
        Drink,
        drink_id,
        options=(selectinload(Drink.category), selectinload(Drink.default_bean)),
    )
    if drink is None:
        raise HTTPException(status_code=404, detail="Drink not found.")
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(drink, field, value)
    await session.commit()
    await session.refresh(drink, attribute_names=["category", "default_bean"])
    return _drink_payload(drink)


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


def _drink_payload(drink: Drink) -> dict[str, object]:
    return {
        "id": drink.id,
        "name": drink.name,
        "category_name": drink.category.label,
        "bean_name": drink.default_bean.name if drink.default_bean else None,
        "description": drink.description,
        "photo_url": drink.photo_url,
        "is_available": drink.is_available,
        "temperature_options": drink.temperature_options,
        "milk_options": drink.milk_options,
        "estimated_time_minutes": drink.estimated_time_minutes,
    }


def _bean_payload(bean: Bean) -> dict[str, object]:
    return {
        "id": bean.id,
        "name": bean.name,
        "origin": bean.origin,
        "process": bean.process,
        "tasting_notes": bean.tasting_notes,
        "is_available": bean.is_available,
    }
