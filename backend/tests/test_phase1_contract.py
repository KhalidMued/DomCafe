from fastapi.testclient import TestClient


def test_health_endpoint_reports_database_and_redis(monkeypatch):
    from app import main

    async def ok_database():
        return True

    async def ok_redis():
        return True

    monkeypatch.setattr(main, "check_database", ok_database)
    monkeypatch.setattr(main, "check_redis", ok_redis)

    response = TestClient(main.app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "redis": "ok",
    }


def test_models_define_phase1_tables():
    from app.models.base import Base
    import app.models.menu  # noqa: F401
    import app.models.order  # noqa: F401
    import app.models.user  # noqa: F401

    assert {
        "categories",
        "beans",
        "drinks",
        "orders",
        "order_items",
        "admin_users",
    }.issubset(Base.metadata.tables.keys())


def test_seed_data_includes_dom_categories_beans_and_drinks():
    from app.db.seed import build_seed_data

    seed = build_seed_data()

    assert len(seed.categories) >= 1
    assert len(seed.beans) >= 1
    assert len(seed.drinks) >= 1
    assert seed.categories[0].label
    assert seed.drinks[0].photo_url
