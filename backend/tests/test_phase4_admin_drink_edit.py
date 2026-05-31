from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def updated_drink_payload():
    return {
        "id": "iced-doum-latte",
        "name": "Iced DŌM Latte",
        "category_name": "Signature",
        "bean_name": "DŌM House Beans",
        "description": "Cold milk, espresso, and a quiet Doum finish.",
        "photo_url": "/uploads/drinks/placeholder.jpg",
        "is_available": True,
        "temperature_options": ["iced"],
        "milk_options": ["whole milk", "oat milk"],
        "estimated_time_minutes": 6,
    }


def test_admin_drink_edit_requires_bearer_token():
    response = client().patch(
        "/api/admin/drinks/iced-doum-latte",
        json={"name": "Iced DŌM Latte"},
    )

    assert response.status_code == 401


def test_admin_can_edit_drink_details(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_drink_details(_session, drink_id, payload):
        assert drink_id == "iced-doum-latte"
        assert payload.name == "Iced DŌM Latte"
        assert payload.description == "Cold milk, espresso, and a quiet Doum finish."
        assert payload.temperature_options == ["iced"]
        assert payload.milk_options == ["whole milk", "oat milk"]
        assert payload.estimated_time_minutes == 6
        return updated_drink_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_drink_details", fake_update_drink_details)

    response = client().patch(
        "/api/admin/drinks/iced-doum-latte",
        headers={"Authorization": "Bearer token"},
        json={
            "name": "Iced DŌM Latte",
            "description": "Cold milk, espresso, and a quiet Doum finish.",
            "temperature_options": ["iced"],
            "milk_options": ["whole milk", "oat milk"],
            "estimated_time_minutes": 6,
        },
    )

    assert response.status_code == 200
    assert response.json() == updated_drink_payload()


def test_admin_drink_edit_rejects_invalid_estimated_time(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().patch(
        "/api/admin/drinks/iced-doum-latte",
        headers={"Authorization": "Bearer token"},
        json={"estimated_time_minutes": 0},
    )

    assert response.status_code == 422
