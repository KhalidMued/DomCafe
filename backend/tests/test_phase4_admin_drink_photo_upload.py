from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_admin_drink_photo_upload_requires_bearer_token():
    response = client().post(
        "/api/admin/uploads/drink-photo",
        data={"drink_id": "iced-doum-latte"},
        files={"photo": ("drink.jpg", b"not-real", "image/jpeg")},
    )

    assert response.status_code == 401


def test_admin_can_upload_drink_photo(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_upload_drink_photo(_session, drink_id, photo):
        assert drink_id == "iced-doum-latte"
        assert photo.filename == "dom-latte.jpg"
        assert photo.content_type == "image/jpeg"
        return {"id": drink_id, "photo_url": "/uploads/drinks/iced-doum-latte-dom-latte.jpg"}

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "upload_drink_photo", fake_upload_drink_photo)

    response = client().post(
        "/api/admin/uploads/drink-photo",
        headers={"Authorization": "Bearer token"},
        data={"drink_id": "iced-doum-latte"},
        files={"photo": ("dom-latte.jpg", b"fake-jpeg", "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "iced-doum-latte",
        "photo_url": "/uploads/drinks/iced-doum-latte-dom-latte.jpg",
    }


def test_admin_drink_photo_upload_requires_photo_file(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().post(
        "/api/admin/uploads/drink-photo",
        headers={"Authorization": "Bearer token"},
        data={"drink_id": "iced-doum-latte"},
    )

    assert response.status_code == 422
