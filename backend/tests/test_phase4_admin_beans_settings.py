from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def bean_payload():
    return {
        "id": "dom-house-beans",
        "name": "DŌM House Beans",
        "origin": "Sudan",
        "process": "Natural",
        "tasting_notes": ["date", "cocoa"],
        "is_available": True,
    }


def settings_payload():
    return {
        "cafe_name": "DŌM",
        "welcome_message": "Welcome to DŌM. Take your time.",
        "orders_open": True,
    }


def test_admin_bean_edit_requires_bearer_token():
    response = client().patch(
        "/api/admin/beans/dom-house-beans",
        json={"name": "DŌM House Beans"},
    )

    assert response.status_code == 401


def test_admin_can_edit_bean_details(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_bean_details(_session, bean_id, payload):
        assert bean_id == "dom-house-beans"
        assert payload.name == "DŌM House Beans"
        assert payload.origin == "Sudan"
        assert payload.process == "Natural"
        assert payload.tasting_notes == ["date", "cocoa"]
        return bean_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_bean_details", fake_update_bean_details)

    response = client().patch(
        "/api/admin/beans/dom-house-beans",
        headers={"Authorization": "Bearer token"},
        json={
            "name": "DŌM House Beans",
            "origin": "Sudan",
            "process": "Natural",
            "tasting_notes": ["date", "cocoa"],
        },
    )

    assert response.status_code == 200
    assert response.json() == bean_payload()


def test_admin_bean_edit_rejects_empty_name(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().patch(
        "/api/admin/beans/dom-house-beans",
        headers={"Authorization": "Bearer token"},
        json={"name": ""},
    )

    assert response.status_code == 422


def test_admin_settings_require_bearer_token():
    response = client().get("/api/admin/settings")

    assert response.status_code == 401


def test_admin_can_get_settings(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_get_admin_settings(_session):
        return settings_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "get_admin_settings", fake_get_admin_settings)

    response = client().get("/api/admin/settings", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == settings_payload()


def test_admin_can_update_settings(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_admin_settings(_session, payload):
        assert payload.cafe_name == "DŌM Home Café"
        assert payload.welcome_message == "Welcome in. Take your time."
        assert payload.orders_open is False
        return {
            "cafe_name": "DŌM Home Café",
            "welcome_message": "Welcome in. Take your time.",
            "orders_open": False,
        }

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_admin_settings", fake_update_admin_settings)

    response = client().patch(
        "/api/admin/settings",
        headers={"Authorization": "Bearer token"},
        json={
            "cafe_name": "DŌM Home Café",
            "welcome_message": "Welcome in. Take your time.",
            "orders_open": False,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "cafe_name": "DŌM Home Café",
        "welcome_message": "Welcome in. Take your time.",
        "orders_open": False,
    }
