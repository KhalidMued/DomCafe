from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def category_payload():
    return {
        "id": "slow-bar",
        "label": "Slow Bar",
        "description": "Manual brews and quiet cups.",
        "accent_color": "#8B5E34",
        "display_order": 9,
        "is_available": True,
    }


def bean_payload():
    return {
        "id": "ethiopia-guji",
        "name": "Ethiopia Guji",
        "origin": "Ethiopia",
        "process": "Natural",
        "tasting_notes": ["berry", "jasmine"],
        "is_available": True,
    }


def drink_payload():
    return {
        "id": "slow-doum-brew",
        "name": "Slow DŌM Brew",
        "category_id": "slow-bar",
        "category_name": "Slow Bar",
        "bean_id": "ethiopia-guji",
        "bean_name": "Ethiopia Guji",
        "description": "A slow filter with a soft Doum finish.",
        "ingredients": ["filter coffee", "doum"],
        "photo_url": "/uploads/drinks/slow-doum-brew.jpg",
        "is_available": True,
        "temperature_options": ["hot"],
        "milk_options": ["none"],
        "estimated_time_minutes": 7,
    }


def test_admin_create_category_requires_bearer_token():
    response = client().post(
        "/api/admin/categories",
        json={"label": "Slow Bar"},
    )

    assert response.status_code == 401


def test_admin_can_create_category(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_create_category(_session, payload):
        assert payload.id == "slow-bar"
        assert payload.label == "Slow Bar"
        assert payload.description == "Manual brews and quiet cups."
        assert payload.accent_color == "#8B5E34"
        assert payload.display_order == 9
        return category_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "create_category", fake_create_category)

    response = client().post(
        "/api/admin/categories",
        headers={"Authorization": "Bearer token"},
        json={
            "id": "slow-bar",
            "label": "Slow Bar",
            "description": "Manual brews and quiet cups.",
            "accent_color": "#8B5E34",
            "display_order": 9,
        },
    )

    assert response.status_code == 201
    assert response.json() == category_payload()


def test_admin_can_create_bean(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_create_bean(_session, payload):
        assert payload.id == "ethiopia-guji"
        assert payload.name == "Ethiopia Guji"
        assert payload.origin == "Ethiopia"
        assert payload.process == "Natural"
        assert payload.tasting_notes == ["berry", "jasmine"]
        return bean_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "create_bean", fake_create_bean)

    response = client().post(
        "/api/admin/beans",
        headers={"Authorization": "Bearer token"},
        json={
            "id": "ethiopia-guji",
            "name": "Ethiopia Guji",
            "origin": "Ethiopia",
            "process": "Natural",
            "tasting_notes": ["berry", "jasmine"],
        },
    )

    assert response.status_code == 201
    assert response.json() == bean_payload()


def test_admin_can_create_drink(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_create_drink(_session, payload):
        assert payload.id == "slow-doum-brew"
        assert payload.name == "Slow DŌM Brew"
        assert payload.category_id == "slow-bar"
        assert payload.default_bean_id == "ethiopia-guji"
        assert payload.description == "A slow filter with a soft Doum finish."
        assert payload.ingredients == ["filter coffee", "doum"]
        assert payload.photo_url == "/uploads/drinks/slow-doum-brew.jpg"
        assert payload.temperature_options == ["hot"]
        assert payload.milk_options == ["none"]
        assert payload.estimated_time_minutes == 7
        return drink_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "create_drink", fake_create_drink)

    response = client().post(
        "/api/admin/drinks",
        headers={"Authorization": "Bearer token"},
        json={
            "id": "slow-doum-brew",
            "name": "Slow DŌM Brew",
            "category_id": "slow-bar",
            "default_bean_id": "ethiopia-guji",
            "description": "A slow filter with a soft Doum finish.",
            "ingredients": ["filter coffee", "doum"],
            "photo_url": "/uploads/drinks/slow-doum-brew.jpg",
            "temperature_options": ["hot"],
            "milk_options": ["none"],
            "estimated_time_minutes": 7,
        },
    )

    assert response.status_code == 201
    assert response.json() == drink_payload()


def test_admin_create_drink_requires_photo_url(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().post(
        "/api/admin/drinks",
        headers={"Authorization": "Bearer token"},
        json={
            "id": "slow-doum-brew",
            "name": "Slow DŌM Brew",
            "category_id": "slow-bar",
            "description": "A slow filter with a soft Doum finish.",
            "temperature_options": ["hot"],
            "milk_options": ["none"],
            "estimated_time_minutes": 7,
        },
    )

    assert response.status_code == 422


def test_admin_can_archive_catalog_items(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_archive_category(_session, category_id):
        assert category_id == "slow-bar"
        return {**category_payload(), "is_available": False}

    async def fake_archive_drink(_session, drink_id):
        assert drink_id == "slow-doum-brew"
        return {**drink_payload(), "is_available": False}

    async def fake_archive_bean(_session, bean_id):
        assert bean_id == "ethiopia-guji"
        return {**bean_payload(), "is_available": False}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "archive_category", fake_archive_category)
    monkeypatch.setattr(routes, "archive_drink", fake_archive_drink)
    monkeypatch.setattr(routes, "archive_bean", fake_archive_bean)

    category_response = client().delete("/api/admin/categories/slow-bar", headers={"Authorization": "Bearer token"})
    drink_response = client().delete("/api/admin/drinks/slow-doum-brew", headers={"Authorization": "Bearer token"})
    bean_response = client().delete("/api/admin/beans/ethiopia-guji", headers={"Authorization": "Bearer token"})

    assert category_response.status_code == 200
    assert category_response.json()["is_available"] is False
    assert drink_response.status_code == 200
    assert drink_response.json()["is_available"] is False
    assert bean_response.status_code == 200
    assert bean_response.json()["is_available"] is False
