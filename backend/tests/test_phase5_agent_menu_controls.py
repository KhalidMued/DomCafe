from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def menu_payload():
    return {
        "categories": [
            {
                "id": "cold_bar",
                "label": "Cold Bar",
                "description": "Cold coffee drinks.",
                "is_available": True,
            }
        ],
        "drinks": [
            {
                "id": "spanish_latte",
                "name": "Spanish Latte",
                "category_id": "cold_bar",
                "category_name": "Cold Bar",
                "bean_id": "dom_house",
                "bean_name": "DŌM House",
                "description": "Sweet espresso milk drink.",
                "ingredients": ["espresso", "milk", "condensed milk"],
                "photo_url": "/uploads/drinks/spanish.jpg",
                "is_available": True,
                "temperature_options": ["hot", "iced"],
                "milk_options": ["whole milk", "oat milk"],
                "estimated_time_minutes": 4,
            }
        ],
        "beans": [
            {
                "id": "dom_house",
                "name": "DŌM House",
                "origin": "Brazil",
                "process": "Natural",
                "tasting_notes": ["cocoa", "almond"],
                "is_available": True,
            }
        ],
    }


def test_agent_menu_requires_agent_api_key():
    response = client().get("/api/agent/menu")

    assert response.status_code == 401


def test_agent_can_read_menu(monkeypatch):
    from app.api.agent import routes

    async def fake_menu(_session):
        return menu_payload()

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "get_agent_menu", fake_menu)

    response = client().get(
        "/api/agent/menu",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == menu_payload()


def test_agent_can_search_drinks(monkeypatch):
    from app.api.agent import routes

    async def fake_search(_session, query):
        assert query == "spanish"
        return [menu_payload()["drinks"][0]]

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "search_agent_drinks", fake_search)

    response = client().get(
        "/api/agent/drinks/search?q=spanish",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == [menu_payload()["drinks"][0]]


def test_agent_drink_search_requires_non_empty_query(monkeypatch):
    from app.api.agent import routes

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")

    response = client().get(
        "/api/agent/drinks/search?q=",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 422


def test_agent_can_update_drink_availability(monkeypatch):
    from app.api.agent import routes

    async def fake_set_drink(_session, drink_id, is_available):
        assert drink_id == "spanish_latte"
        assert is_available is False
        return {"id": "spanish_latte", "is_available": False}

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "set_drink_availability", fake_set_drink)

    response = client().patch(
        "/api/agent/drinks/spanish_latte/availability",
        headers={"Authorization": "Bearer agent-key"},
        json={"is_available": False},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "spanish_latte", "is_available": False}


def test_agent_can_list_beans(monkeypatch):
    from app.api.agent import routes

    async def fake_beans(_session):
        return menu_payload()["beans"]

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "list_agent_beans", fake_beans)

    response = client().get(
        "/api/agent/beans",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == menu_payload()["beans"]


def test_agent_can_search_beans(monkeypatch):
    from app.api.agent import routes

    async def fake_search(_session, query):
        assert query == "house"
        return menu_payload()["beans"]

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "search_agent_beans", fake_search)

    response = client().get(
        "/api/agent/beans/search?q=house",
        headers={"Authorization": "Bearer agent-key"},
    )

    assert response.status_code == 200
    assert response.json() == menu_payload()["beans"]


def test_agent_can_update_bean_availability(monkeypatch):
    from app.api.agent import routes

    async def fake_set_bean(_session, bean_id, is_available):
        assert bean_id == "dom_house"
        assert is_available is True
        return {"id": "dom_house", "is_available": True}

    monkeypatch.setattr(routes, "get_agent_api_key", lambda: "agent-key")
    monkeypatch.setattr(routes, "set_bean_availability", fake_set_bean)

    response = client().patch(
        "/api/agent/beans/dom_house/availability",
        headers={"Authorization": "Bearer agent-key"},
        json={"is_available": True},
    )

    assert response.status_code == 200
    assert response.json() == {"id": "dom_house", "is_available": True}
