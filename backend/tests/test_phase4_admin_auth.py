from fastapi.testclient import TestClient


def client():
    from app.main import app

    return TestClient(app)


def test_admin_login_returns_bearer_token(monkeypatch):
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
    assert response.json() == {"access_token": "jwt-token", "token_type": "bearer"}


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
