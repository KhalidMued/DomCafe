from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_responses_carry_a_request_id_header(monkeypatch):
    from app import main

    async def ok_database():
        return True

    async def ok_redis():
        return True

    monkeypatch.setattr(main, "check_database", ok_database)
    monkeypatch.setattr(main, "check_redis", ok_redis)

    first = client().get("/api/health")
    second = client().get("/api/health")

    assert first.status_code == 200
    assert len(first.headers["x-request-id"]) == 12
    assert first.headers["x-request-id"] != second.headers["x-request-id"]


def test_as_bool_parses_stored_setting_strings():
    from app.core.parsing import as_bool

    assert as_bool("true", False) is True
    assert as_bool(" YES ", False) is True
    assert as_bool("false", True) is False
    assert as_bool("0", True) is False
    assert as_bool(None, True) is True
    assert as_bool(None, False) is False


def test_admin_drink_update_allows_clearing_default_bean(monkeypatch):
    from app.api.admin import routes

    captured: dict[str, object] = {}

    async def fake_current_admin():
        return "1"

    async def fake_update_drink_details(_session, drink_id, payload):
        updates = payload.model_dump(exclude_unset=True)
        captured["drink_id"] = drink_id
        captured["updates"] = updates
        return {
            "id": drink_id,
            "name": "Espresso",
            "category_id": "espresso_bar",
            "category_name": "Espresso Bar",
            "bean_id": None,
            "bean_name": None,
            "description": "Quiet and simple.",
            "ingredients": [],
            "photo_url": "/uploads/drinks/placeholder.jpg",
            "is_available": True,
            "temperature_options": ["hot"],
            "milk_options": [],
            "estimated_time_minutes": 2,
        }

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_drink_details", fake_update_drink_details)

    response = client().patch(
        "/api/admin/drinks/espresso",
        json={"default_bean_id": None},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 200
    assert captured["updates"] == {"default_bean_id": None}
    assert response.json()["bean_id"] is None


def test_order_creation_schedules_discord_notification_without_awaiting(monkeypatch):
    import asyncio

    from app.services import public

    fired: list[int] = []

    async def fake_notify(order_id: int) -> None:
        fired.append(order_id)

    monkeypatch.setattr(public, "notify_new_order_if_enabled", fake_notify)

    async def run() -> None:
        public._schedule_order_notification(41)
        await asyncio.sleep(0)

    asyncio.run(run())

    assert fired == [41]
