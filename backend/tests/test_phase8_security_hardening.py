from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_generate_order_public_code_is_random_and_url_safe():
    from app.services.public import generate_order_public_code

    codes = {generate_order_public_code() for _ in range(50)}

    assert len(codes) == 50
    for code in codes:
        assert len(code) >= 12
        assert not code.isdigit()
        assert all(ch.isalnum() or ch in "-_" for ch in code)


def test_orders_table_has_unique_public_code_column():
    from app.models.base import Base
    import app.models.order  # noqa: F401

    column = Base.metadata.tables["orders"].columns["public_code"]

    assert column.nullable is False
    assert column.unique is True


def test_whitespace_only_guest_name_returns_friendly_validation_error():
    response = client().post(
        "/api/orders",
        json={
            "guest_name": "   ",
            "items": [{"drink_id": "espresso", "quantity": 1}],
        },
    )

    assert response.status_code == 422
    assert response.json() == {
        "error": True,
        "code": "INVALID_INPUT",
        "message": "Please check your order details and try again.",
    }


def test_order_status_route_looks_up_by_public_code(monkeypatch):
    from app.api.public import routes

    seen: dict[str, str] = {}

    async def fake_order_status(_session, order_code):
        seen["order_code"] = order_code
        return {
            "id": order_code,
            "order_number": 12,
            "guest_name": "Ahmed",
            "status": "preparing",
            "status_label": "Your drink is being prepared.",
            "items": [],
            "created_at": "2026-07-08T12:00:00Z",
        }

    monkeypatch.setattr(routes, "get_guest_order_status", fake_order_status)

    response = client().get("/api/orders/k3TqX9-w2ZbYpLmA")

    assert response.status_code == 200
    assert seen["order_code"] == "k3TqX9-w2ZbYpLmA"
    assert response.json()["id"] == "k3TqX9-w2ZbYpLmA"
