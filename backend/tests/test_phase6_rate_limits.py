from fastapi.testclient import TestClient


class FakeRedis:
    def __init__(self):
        self.counts: dict[str, int] = {}
        self.expirations: dict[str, int] = {}

    async def eval(self, _script: str, _key_count: int, key: str, seconds: str) -> int:
        self.counts[key] = self.counts.get(key, 0) + 1
        if self.counts[key] == 1:
            self.expirations[key] = int(seconds)
        return self.counts[key]

    async def aclose(self) -> None:
        return None


def client():
    from app.main import app

    return TestClient(app)


def test_admin_login_is_rate_limited_by_client_ip(monkeypatch):
    from app.api.admin import routes as admin_routes
    from app.security import rate_limit

    fake_redis = FakeRedis()

    async def fake_authenticate(_session, _username, _password):
        return None

    monkeypatch.setattr(rate_limit, "get_redis", lambda: fake_redis)
    monkeypatch.setattr(rate_limit, "ADMIN_LOGIN_MAX_ATTEMPTS", 5)
    monkeypatch.setattr(admin_routes, "authenticate_admin", fake_authenticate)

    test_client = client()
    payload = {"username": "admin", "password": "wrong"}

    for _ in range(5):
        response = test_client.post("/api/admin/login", json=payload)
        assert response.status_code == 401

    response = test_client.post("/api/admin/login", json=payload)

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many login attempts. Please try again shortly."}


def test_admin_login_ignores_client_supplied_forwarded_for(monkeypatch):
    from app.api.admin import routes as admin_routes
    from app.security import rate_limit

    fake_redis = FakeRedis()

    async def fake_authenticate(_session, _username, _password):
        return None

    monkeypatch.setattr(rate_limit, "get_redis", lambda: fake_redis)
    monkeypatch.setattr(rate_limit, "ADMIN_LOGIN_MAX_ATTEMPTS", 5)
    monkeypatch.setattr(admin_routes, "authenticate_admin", fake_authenticate)

    test_client = client()
    payload = {"username": "admin", "password": "wrong"}

    for attempt in range(5):
        response = test_client.post(
            "/api/admin/login",
            json=payload,
            headers={"x-forwarded-for": f"203.0.113.{attempt}"},
        )
        assert response.status_code == 401

    response = test_client.post(
        "/api/admin/login",
        json=payload,
        headers={"x-forwarded-for": "203.0.113.99"},
    )

    assert response.status_code == 429


def test_order_creation_is_rate_limited_by_client_ip(monkeypatch):
    from app.api.public import routes as public_routes
    from app.security import rate_limit

    fake_redis = FakeRedis()
    calls = 0

    async def fake_create_order(_session, _payload):
        nonlocal calls
        calls += 1
        return {
            "order_id": "order-id",
            "order_number": 42,
            "status": "new",
            "message": "Your order was sent to the bar.",
        }

    monkeypatch.setattr(rate_limit, "get_redis", lambda: fake_redis)
    monkeypatch.setattr(rate_limit, "ORDER_CREATE_MAX_ATTEMPTS", 10)
    monkeypatch.setattr(public_routes, "create_guest_order", fake_create_order)

    test_client = client()
    payload = {
        "guest_name": "Khalid",
        "items": [
            {
                "drink_id": "drink-id",
                "quantity": 1,
            }
        ],
    }

    for _ in range(10):
        response = test_client.post("/api/orders", json=payload)
        assert response.status_code == 201

    response = test_client.post("/api/orders", json=payload)

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many orders from this device. Please try again shortly."}
    assert calls == 10
