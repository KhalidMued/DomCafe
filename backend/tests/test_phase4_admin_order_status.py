from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_admin_can_update_order_status_with_bearer_token(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_update_status(_session, order_id, status):
        assert order_id == 12
        assert status == "preparing"
        return {
            "id": "12",
            "order_number": 12,
            "status": "preparing",
            "status_label": "Your drink is being prepared.",
        }

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "update_order_status", fake_update_status)

    response = client().patch(
        "/api/admin/orders/12/status",
        headers={"Authorization": "Bearer token"},
        json={"status": "preparing"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "12",
        "order_number": 12,
        "status": "preparing",
        "status_label": "Your drink is being prepared.",
    }


def test_admin_order_status_update_requires_token():
    response = client().patch(
        "/api/admin/orders/12/status",
        json={"status": "preparing"},
    )

    assert response.status_code == 401


def test_admin_order_status_update_rejects_invalid_status(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)

    response = client().patch(
        "/api/admin/orders/12/status",
        headers={"Authorization": "Bearer token"},
        json={"status": "brewing-fast"},
    )

    assert response.status_code == 422
