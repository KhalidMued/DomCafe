"""Shared payload builders for menu entities.

Used by both the admin and agent services; each route's response_model
prunes any fields it does not expose.
"""
from app.models.menu import Bean, Category, Drink


def drink_payload(drink: Drink) -> dict[str, object]:
    return {
        "id": drink.id,
        "name": drink.name,
        "category_id": drink.category_id,
        "category_name": drink.category.label,
        "bean_id": drink.default_bean_id,
        "bean_name": drink.default_bean.name if drink.default_bean else None,
        "description": drink.description,
        "ingredients": drink.ingredients,
        "photo_url": drink.photo_url,
        "is_available": drink.is_available,
        "temperature_options": drink.temperature_options,
        "milk_options": drink.milk_options,
        "estimated_time_minutes": drink.estimated_time_minutes,
    }


def bean_payload(bean: Bean) -> dict[str, object]:
    return {
        "id": bean.id,
        "name": bean.name,
        "origin": bean.origin,
        "process": bean.process,
        "tasting_notes": bean.tasting_notes,
        "is_available": bean.is_available,
    }


def category_payload(category: Category) -> dict[str, object]:
    return {
        "id": category.id,
        "label": category.label,
        "description": category.description,
        "accent_color": category.accent_color,
        "display_order": category.display_order,
        "is_available": category.is_available,
    }
