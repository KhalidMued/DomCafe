from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import Bean, Category, Drink
from app.models.setting import Setting
from app.schemas.admin import (
    AdminBeanCreate,
    AdminBeanUpdate,
    AdminCategoryCreate,
    AdminCategoryUpdate,
    AdminDrinkCreate,
    AdminDrinkUpdate,
    AdminSettingsUpdate,
)
from app.core.parsing import as_bool
from app.services.public import DEFAULT_PUBLIC_SETTINGS
from app.services.serializers import bean_payload, category_payload, drink_payload


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
    categories = (
        await session.execute(select(Category).order_by(Category.display_order, Category.label))
    ).scalars().all()
    return {
        "orders_open": orders_open,
        "categories": [category_payload(category) for category in categories],
        "drinks": [drink_payload(drink) for drink in drinks],
        "beans": [bean_payload(bean) for bean in beans],
    }


async def create_category(session: AsyncSession, payload: AdminCategoryCreate) -> dict[str, object]:
    if await session.get(Category, payload.id) is not None:
        raise HTTPException(status_code=409, detail="Category already exists.")
    category = Category(**payload.model_dump(), is_available=True)
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category_payload(category)


async def update_category_details(
    session: AsyncSession, category_id: str, payload: AdminCategoryUpdate
) -> dict[str, object]:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(category, field, value)
    await session.commit()
    await session.refresh(category)
    return category_payload(category)


async def archive_category(session: AsyncSession, category_id: str) -> dict[str, object]:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    category.is_available = False
    await session.commit()
    await session.refresh(category)
    return category_payload(category)


async def create_bean(session: AsyncSession, payload: AdminBeanCreate) -> dict[str, object]:
    if await session.get(Bean, payload.id) is not None:
        raise HTTPException(status_code=409, detail="Bean already exists.")
    bean = Bean(**payload.model_dump(), is_available=True)
    session.add(bean)
    await session.commit()
    await session.refresh(bean)
    return bean_payload(bean)


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
    return bean_payload(bean)


async def archive_bean(session: AsyncSession, bean_id: str) -> dict[str, object]:
    bean = await session.get(Bean, bean_id)
    if bean is None:
        raise HTTPException(status_code=404, detail="Bean not found.")
    bean.is_available = False
    await session.commit()
    await session.refresh(bean)
    return bean_payload(bean)


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
        "orders_open": as_bool(stored.get("orders_open"), bool(DEFAULT_PUBLIC_SETTINGS["orders_open"])),
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


async def create_drink(session: AsyncSession, payload: AdminDrinkCreate) -> dict[str, object]:
    if await session.get(Drink, payload.id) is not None:
        raise HTTPException(status_code=409, detail="Drink already exists.")
    if await session.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    if payload.default_bean_id and await session.get(Bean, payload.default_bean_id) is None:
        raise HTTPException(status_code=404, detail="Bean not found.")
    drink = Drink(**payload.model_dump(), is_available=True)
    session.add(drink)
    await session.commit()
    await session.refresh(drink, attribute_names=["category", "default_bean"])
    return drink_payload(drink)


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
    if "category_id" in updates and await session.get(Category, updates["category_id"]) is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    # An explicit null clears the default bean; only validate real ids.
    if updates.get("default_bean_id") is not None and await session.get(Bean, updates["default_bean_id"]) is None:
        raise HTTPException(status_code=404, detail="Bean not found.")
    for field, value in updates.items():
        setattr(drink, field, value)
    await session.commit()
    await session.refresh(drink, attribute_names=["category", "default_bean"])
    return drink_payload(drink)


async def archive_drink(session: AsyncSession, drink_id: str) -> dict[str, object]:
    drink = await session.get(
        Drink,
        drink_id,
        options=(selectinload(Drink.category), selectinload(Drink.default_bean)),
    )
    if drink is None:
        raise HTTPException(status_code=404, detail="Drink not found.")
    drink.is_available = False
    await session.commit()
    await session.refresh(drink, attribute_names=["category", "default_bean"])
    return drink_payload(drink)


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


async def set_category_availability(
    session: AsyncSession, category_id: str, is_available: bool
) -> dict[str, object]:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    category.is_available = is_available
    await session.commit()
    return {"id": category.id, "is_available": category.is_available}


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
    return as_bool(
        setting.value if setting else None,
        bool(DEFAULT_PUBLIC_SETTINGS["orders_open"]),
    )


