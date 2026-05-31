from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def pending_orders_payload():
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


def test_agent_status_requires_agent_api_key():
    response = client().get("/api/agent/status")

    assert response.status_code == 401


def test_agent_status_rejects_wrong_agent_api_key(monkeypatch):
    from app.api.agent import routes

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "expected-agent-key")

    response = client().get(
        "/api/agent/status",
        headers={"Authorization": "Bearer wrong-agent-key"},
    )

    assert response.status_code == 403


def test_agent_status_returns_operational_summary(monkeypatch):
    from app.api.agent import routes

    async def fake_status(_session):
        return {"status": "ok", "orders_open": True, "pending_orders_count": 2}

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "get_agent_status", fake_status)

    response = client().get(
        "/api/agent/status",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "orders_open": True, "pending_orders_count": 2}


def test_agent_can_list_pending_orders(monkeypatch):
    from app.api.agent import routes

    async def fake_pending(_session):
        return pending_orders_payload()

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "list_pending_orders", fake_pending)

    response = client().get(
        "/api/agent/orders/pending",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == pending_orders_payload()


def test_agent_can_update_order_status(monkeypatch):
    from app.api.agent import routes

    async def fake_update(_session, order_id, order_status):
        assert order_id == 18
        assert order_status == "ready"
        return {
            "id": "18",
            "order_number": 18,
            "status": "ready",
            "status_label": "Your drink is ready.",
        }

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "update_order_status", fake_update)

    response = client().patch(
        "/api/agent/orders/18/status",
        headers={"Authorization": "Bearer agent-key"},
        json={"status": "ready"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "18",
        "order_number": 18,
        "status": "ready",
        "status_label": "Your drink is ready.",
    }


def test_agent_order_status_rejects_invalid_status(monkeypatch):
    from app.api.agent import routes

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")

    response = client().patch(
        "/api/agent/orders/18/status",
        headers={"Authorization": "Bearer agent-key"},
        json={"status": "lost"},
    )

    assert response.status_code == 422
