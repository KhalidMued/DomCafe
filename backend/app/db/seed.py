from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

from sqlalchemy.dialects.postgresql import insert

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.menu import Bean, Category, Drink
from app.models.user import AdminUser


@dataclass(frozen=True)
class SeedRow:
    values: dict[str, Any]

    def __getattr__(self, name: str) -> Any:
        return self.values[name]


@dataclass(frozen=True)
class SeedData:
    categories: list[SeedRow]
    beans: list[SeedRow]
    drinks: list[SeedRow]


def _row(values: dict[str, Any]) -> SeedRow:
    return SeedRow(values=values)


def _rows_for_insert(rows: list[SeedRow]) -> list[dict[str, Any]]:
    return [row.values for row in rows]


def _brand_document_path() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "docs" / "dom_hermes_agent_v1_2.json"
        if candidate.exists():
            return candidate
    raise FileNotFoundError("docs/dom_hermes_agent_v1_2.json")


def build_seed_data() -> SeedData:
    data = json.loads(_brand_document_path().read_text())
    menu = data["menu"]
    bean_items = data.get("beans", {}).get("items", [])
    beans = [
        _row(
            {
                "id": bean["id"],
                "name": bean["name"],
                "name_ar": bean.get("name_ar"),
                "origin": bean.get("origin"),
                "process": bean.get("process"),
                "tasting_notes": bean.get("tasting_notes", []),
                "is_available": True,
            }
        )
        for bean in bean_items
    ]
    if not beans:
        beans = [
            _row(
                {
                    "id": "dom_house_bean",
                    "name": "DŌM House Bean",
                    "name_ar": "حبوب دوم الخاصة",
                    "origin": "House selection",
                    "process": None,
                    "tasting_notes": [],
                    "is_available": True,
                }
            )
        ]

    default_bean_id = beans[0].id
    categories = []
    drinks = []
    for category in menu["categories"]:
        categories.append(
            _row(
                {
                    "id": category["id"],
                    "label": category["label"],
                    "label_ar": category.get("label_ar"),
                    "description": category.get("description"),
                    "accent_color": category.get("accent_color"),
                    "display_order": category.get("display_order", 0),
                    "is_available": True,
                }
            )
        )
        for item in category.get("items", []):
            drinks.append(
                _row(
                    {
                        "id": item["id"],
                        "category_id": category["id"],
                        "default_bean_id": item.get("default_bean_id", default_bean_id),
                        "name": item["name"],
                        "name_ar": item.get("name_ar"),
                        "description": item.get("description"),
                        "temperature_options": item.get("temperature_options", []),
                        "milk_options": item.get("milk_options", []),
                        "ingredients": item.get("ingredients", []),
                        "estimated_time_minutes": item.get("estimated_time_minutes", 5),
                        "photo_url": item["photo_url"],
                        "is_available": True,
                    }
                )
            )
    return SeedData(categories=categories, beans=beans, drinks=drinks)


async def seed_database() -> None:
    seed = build_seed_data()
    settings = get_settings()
    async with AsyncSessionLocal() as session:
        for model, rows in ((Category, seed.categories), (Bean, seed.beans), (Drink, seed.drinks)):
            if not rows:
                continue
            statement = insert(model).values(_rows_for_insert(rows))
            statement = statement.on_conflict_do_nothing(index_elements=["id"])
            await session.execute(statement)
        admin_statement = insert(AdminUser).values(
            username=settings.admin_default_username,
            password_hash=hash_password(settings.admin_default_password),
            is_active=True,
        )
        admin_statement = admin_statement.on_conflict_do_nothing(index_elements=["username"])
        await session.execute(admin_statement)
        await session.commit()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_database())
