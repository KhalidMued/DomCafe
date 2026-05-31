from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def category_payload():
    return {
        "id": "cold-bar",
        "label": "Cold Bar",
        "description": "Cold coffee for long afternoons.",
        "accent_color": "#5DCAA5",
        "display_order": 3,
        "is_available": True,
    }


def drink_payload():
    return {
        "id": "iced-doum-latte",
        "name": "Iced DŌM Latte",
        "category_id": "cold-bar",
        "category_name": "Cold Bar",
        "bean_id": "dom-house-beans",
        "bean_name": "DŌM House Beans",
        "description": "Cold milk, espresso, and a quiet Doum finish.",
        "ingredients": ["espresso", "milk"],
        "photo_url": "/uploads/drinks/placeholder.jpg",
        "is_available": True,
        "temperature_options": ["iced"],
        "milk_options": ["whole milk", "oat milk"],
        "estimated_time_minutes": 6,
    }


def test_admin_category_edit_requires_bearer_token():
    response = client().patch(
        "/api/admin/categories/cold-bar",
        json={"label": "Cold Bar"},
    )

    assert response.status_code == 401


def test_admin_can_edit_category_details(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_category_details(_session, category_id, payload):
        assert category_id == "cold-bar"
        assert payload.label == "Cold Bar"
        assert payload.description == "Cold coffee for long afternoons."
        assert payload.accent_color == "#5DCAA5"
        assert payload.display_order == 3
        return category_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_category_details", fake_update_category_details)

    response = client().patch(
        "/api/admin/categories/cold-bar",
        headers={"Authorization": "Bearer token"},
        json={
            "label": "Cold Bar",
            "description": "Cold coffee for long afternoons.",
            "accent_color": "#5DCAA5",
            "display_order": 3,
        },
    )

    assert response.status_code == 200
    assert response.json() == category_payload()


def test_admin_can_toggle_category_availability(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_set_category_availability(_session, category_id, is_available):
        assert category_id == "cold-bar"
        assert is_available is False
        return {"id": "cold-bar", "is_available": False}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "set_category_availability", fake_set_category_availability)

    response = client().patch(
        "/api/admin/menu/categories/cold-bar",
        headers={"Authorization": "Bearer token"},
        json={"is_available": False},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "cold-bar", "is_available": False}


def test_admin_category_edit_rejects_empty_label(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().patch(
        "/api/admin/categories/cold-bar",
        headers={"Authorization": "Bearer token"},
        json={"label": ""},
    )

    assert response.status_code == 422


def test_admin_can_edit_drink_catalog_fields(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_drink_details(_session, drink_id, payload):
        assert drink_id == "iced-doum-latte"
        assert payload.category_id == "cold-bar"
        assert payload.default_bean_id == "dom-house-beans"
        assert payload.ingredients == ["espresso", "milk"]
        return drink_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_drink_details", fake_update_drink_details)

    response = client().patch(
        "/api/admin/drinks/iced-doum-latte",
        headers={"Authorization": "Bearer token"},
        json={
            "category_id": "cold-bar",
            "default_bean_id": "dom-house-beans",
            "ingredients": ["espresso", "milk"],
        },
    )

    assert response.status_code == 200
    assert response.json() == drink_payload()
