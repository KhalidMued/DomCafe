from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def dashboard_payload():
    return {
        "new_orders_count": 2,
        "preparing_orders_count": 1,
        "ready_orders_count": 3,
        "orders_open": True,
        "available_drinks_count": 22,
        "available_beans_count": 1,
    }


def test_admin_dashboard_requires_bearer_token():
    response = client().get("/api/admin/dashboard")

    assert response.status_code == 401


def test_admin_can_get_dashboard_summary(monkeypatch):
    from app.api.admin import routes

    async def fake_current_admin():
        return "1"

    async def fake_dashboard_summary(_session):
        return dashboard_payload()

    monkeypatch.setattr(routes, "require_admin", fake_current_admin)
    monkeypatch.setattr(routes, "get_dashboard_summary", fake_dashboard_summary)

    response = client().get("/api/admin/dashboard", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == dashboard_payload()
