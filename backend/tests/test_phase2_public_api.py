from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_public_settings_returns_guest_safe_defaults(monkeypatch):
    from app.api.public import routes

    async def fake_settings(_session):
        return {
            "cafe_name": "DŌM",
            "welcome_message": "Welcome to DŌM. Take your time.",
            "orders_open": True,
        }

    monkeypatch.setattr(routes, "get_public_settings", fake_settings)

    response = client().get("/api/settings/public")

    assert response.status_code == 200
    assert response.json() == {
        "cafe_name": "DŌM",
        "welcome_message": "Welcome to DŌM. Take your time.",
        "orders_open": True,
    }


def test_public_menu_returns_categories_and_available_drinks(monkeypatch):
    from app.api.public import routes

    async def fake_menu(_session):
        return [
            {
                "id": "espresso-bar",
                "name": "Espresso Bar",
                "description": "Quiet espresso classics.",
                "drinks": [
                    {
                        "id": "spanish-latte",
                        "name": "Spanish Latte",
                        "description": "A smooth espresso milk drink with a sweet finish.",
                        "ingredients": ["espresso", "milk", "condensed milk"],
                        "bean": {
                            "id": "albal-brazilian",
                            "name": "Albal Brazilian",
                            "origin": "Brazil",
                            "tasting_notes": ["chocolate", "nuts", "caramel"],
                        },
                        "photo_url": "/uploads/drinks/placeholder.jpg",
                        "available": True,
                        "temperature_options": ["hot", "iced"],
                        "milk_options": ["whole milk", "oat milk"],
                        "estimated_time_minutes": 4,
                    }
                ],
            }
        ]

    monkeypatch.setattr(routes, "get_public_menu", fake_menu)

    response = client().get("/api/menu")

    assert response.status_code == 200
    data = response.json()
    assert data[0]["name"] == "Espresso Bar"
    assert data[0]["drinks"][0]["name"] == "Spanish Latte"
    assert data[0]["drinks"][0]["bean"]["name"] == "Albal Brazilian"


def test_create_order_returns_tracking_details(monkeypatch):
    from app.api.public import routes

    async def fake_create_order(_session, payload):
        assert payload.guest_name == "Ahmed"
        assert payload.items[0].quantity == 2
        return {
            "order_id": "12",
            "order_number": 12,
            "status": "new",
            "message": "Your order was sent to the bar.",
        }

    monkeypatch.setattr(routes, "create_guest_order", fake_create_order)

    response = client().post(
        "/api/orders",
        json={
            "guest_name": "Ahmed",
            "guest_note": "We are sitting outside.",
            "items": [
                {
                    "drink_id": "spanish-latte",
                    "quantity": 2,
                    "temperature": "iced",
                    "milk_option": "whole milk",
                    "item_note": "Less sweet please.",
                }
            ],
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "order_id": "12",
        "order_number": 12,
        "status": "new",
        "message": "Your order was sent to the bar.",
    }


def test_get_order_status_returns_friendly_status(monkeypatch):
    from app.api.public import routes

    async def fake_order_status(_session, order_code):
        assert order_code == "12"
        return {
            "id": "12",
            "order_number": 12,
            "guest_name": "Ahmed",
            "status": "preparing",
            "status_label": "Your drink is being prepared.",
            "items": [
                {
                    "drink_name": "Spanish Latte",
                    "quantity": 2,
                    "temperature": "iced",
                    "milk_option": "whole milk",
                    "item_note": "Less sweet please.",
                    "bean_name": "Albal Brazilian",
                    "photo_url": "/uploads/drinks/placeholder.jpg",
                }
            ],
            "created_at": "2026-05-30T12:00:00Z",
        }

    monkeypatch.setattr(routes, "get_guest_order_status", fake_order_status)

    response = client().get("/api/orders/12")

    assert response.status_code == 200
    assert response.json()["status_label"] == "Your drink is being prepared."
    assert response.json()["items"][0]["bean_name"] == "Albal Brazilian"


def test_invalid_order_input_returns_friendly_error_shape():
    response = client().post(
        "/api/orders",
        json={"guest_name": "", "items": []},
    )

    assert response.status_code == 422
    assert response.json() == {
        "error": True,
        "code": "INVALID_INPUT",
        "message": "Please check your order details and try again.",
    }
