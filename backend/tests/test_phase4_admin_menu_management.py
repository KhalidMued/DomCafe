from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def menu_payload():
    return {
        "orders_open": True,
        "categories": [
            {
                "id": "signature",
                "label": "Signature",
                "description": "House drinks.",
                "accent_color": "#BA7517",
                "display_order": 1,
                "is_available": True,
            }
        ],
        "drinks": [
            {
                "id": "iced-doum-latte",
                "name": "Iced Doum Latte",
                "category_id": "signature",
                "category_name": "Signature",
                "bean_id": "dom-house-beans",
                "bean_name": "DŌM House Beans",
                "description": "A cold espresso milk drink.",
                "ingredients": ["espresso", "milk"],
                "photo_url": "/uploads/drinks/placeholder.jpg",
                "is_available": True,
                "temperature_options": ["iced"],
                "milk_options": ["whole milk", "oat milk"],
                "estimated_time_minutes": 5,
            }
        ],
        "beans": [
            {
                "id": "dom-house-beans",
                "name": "DŌM House Beans",
                "origin": "Sudan",
                "process": "Natural",
                "tasting_notes": ["date", "cocoa"],
                "is_available": True,
            }
        ],
    }


def test_admin_menu_management_requires_bearer_token():
    response = client().get("/api/admin/menu")

    assert response.status_code == 401


def test_admin_can_get_menu_management_summary(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_menu_summary(_session):
        return menu_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "get_menu_management_summary", fake_menu_summary)

    response = client().get("/api/admin/menu", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == menu_payload()


def test_admin_can_toggle_drink_availability(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_set_drink_availability(_session, drink_id, is_available):
        assert drink_id == "iced-doum-latte"
        assert is_available is False
        return {"id": drink_id, "is_available": False}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "set_drink_availability", fake_set_drink_availability)

    response = client().patch(
        "/api/admin/menu/drinks/iced-doum-latte",
        headers={"Authorization": "Bearer token"},
        json={"is_available": False},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "iced-doum-latte", "is_available": False}


def test_admin_can_toggle_bean_availability(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_set_bean_availability(_session, bean_id, is_available):
        assert bean_id == "dom-house-beans"
        assert is_available is False
        return {"id": bean_id, "is_available": False}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "set_bean_availability", fake_set_bean_availability)

    response = client().patch(
        "/api/admin/menu/beans/dom-house-beans",
        headers={"Authorization": "Bearer token"},
        json={"is_available": False},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "dom-house-beans", "is_available": False}


def test_admin_can_update_orders_open_setting(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_set_orders_open(_session, orders_open):
        assert orders_open is False
        return {"orders_open": False}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "set_orders_open", fake_set_orders_open)

    response = client().patch(
        "/api/admin/menu/settings/orders-open",
        headers={"Authorization": "Bearer token"},
        json={"orders_open": False},
    )

    assert response.status_code == 200
    assert response.json() == {"orders_open": False}
