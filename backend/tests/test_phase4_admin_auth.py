from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_admin_login_sets_httponly_session_cookies(monkeypatch):
    from app.api.admin import routes

    async def fake_authenticate(_session, username, password):
        assert username == "admin"
        assert password == "change_me"
        return {"access_token": "jwt-token", "token_type": "bearer"}

    monkeypatch.setattr(routes, "authenticate_admin", fake_authenticate)

    response = client().post(
        "/api/admin/login",
        json={"username": "admin", "password": "change_me"},
    )

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    # The JWT must never appear in the body — only in the httpOnly cookie.
    assert "jwt-token" not in response.text
    set_cookies = response.headers.get_list("set-cookie")
    jwt_cookie = next(cookie for cookie in set_cookies if cookie.startswith("dom_admin_jwt="))
    hint_cookie = next(cookie for cookie in set_cookies if cookie.startswith("dom_admin_session="))
    assert "jwt-token" in jwt_cookie
    assert "HttpOnly" in jwt_cookie
    assert "SameSite=strict" in jwt_cookie.replace("SameSite=Strict", "SameSite=strict")
    assert "HttpOnly" not in hint_cookie


def test_admin_logout_clears_session_cookies():
    response = client().post("/api/admin/logout")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    set_cookies = response.headers.get_list("set-cookie")
    assert any(cookie.startswith('dom_admin_jwt="";') for cookie in set_cookies)
    assert any(cookie.startswith('dom_admin_session="";') for cookie in set_cookies)


def test_admin_routes_accept_the_jwt_cookie(monkeypatch):
    from app.api.admin import routes

    async def fake_get_active_admin_id(_session, token):
        return "1" if token == "cookie-jwt" else None

    async def fake_summary(_session):
        return {
            "new_orders_count": 0,
            "preparing_orders_count": 0,
            "ready_orders_count": 0,
            "orders_open": True,
            "available_drinks_count": 0,
            "available_beans_count": 0,
        }

    monkeypatch.setattr(routes, "get_active_admin_id", fake_get_active_admin_id)
    monkeypatch.setattr(routes, "get_dashboard_summary", fake_summary)

    response = client().get("/api/admin/dashboard", cookies={"dom_admin_jwt": "cookie-jwt"})

    assert response.status_code == 200
    assert response.json()["orders_open"] is True


def test_admin_login_rejects_invalid_credentials(monkeypatch):
    from app.api.admin import routes

    async def fake_authenticate(_session, username, password):
        assert username == "admin"
        assert password == "wrong"
        return None

    monkeypatch.setattr(routes, "authenticate_admin", fake_authenticate)

    response = client().post(
        "/api/admin/login",
        json={"username": "admin", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid username or password."}
