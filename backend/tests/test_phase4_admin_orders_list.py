from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def orders_payload():
    return [
        {
            "id": "18",
            "order_number": 18,
            "guest_name": "Mona",
            "status": "new",
            "status_label": "Your order was sent to the bar.",
            "items_count": 2,
            "created_at": "2026-05-30T18:00:00Z",
        },
        {
            "id": "17",
            "order_number": 17,
            "guest_name": "Khalid",
            "status": "preparing",
            "status_label": "Your drink is being prepared.",
            "items_count": 1,
            "created_at": "2026-05-30T17:45:00Z",
        },
    ]


def test_admin_orders_list_requires_bearer_token():
    response = client().get("/api/admin/orders")

    assert response.status_code == 401


def test_admin_can_list_recent_orders(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_list_orders(_session):
        return orders_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "list_recent_orders", fake_list_orders)

    response = client().get("/api/admin/orders", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == orders_payload()
