import asyncio
from io import BytesIO
from types import SimpleNamespace

import pytest
from PIL import Image


class FakeSession:
    def __init__(self, entity=None, scalars=None, execute_rows=None):
        self.entity = entity
        self.scalars = list(scalars or [])
        self.execute_rows = execute_rows or []
        self.committed = False

    async def get(self, _model, _key):
        return self.entity

    async def scalar(self, _statement):
        return self.scalars.pop(0)

    async def execute(self, _statement):
        rows = self.execute_rows

        class Result:
            def all(self):
                return rows

        return Result()

    async def commit(self):
        self.committed = True


def _jpeg_bytes(width: int, height: int) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), color=(186, 117, 23)).save(buffer, format="JPEG")
    return buffer.getvalue()


def test_uploaded_photos_are_reencoded_as_capped_webp(monkeypatch, tmp_path):
    from starlette.datastructures import Headers, UploadFile

    from app.services import admin_uploads

    monkeypatch.setattr(
        admin_uploads,
        "get_settings",
        lambda: SimpleNamespace(upload_dir=str(tmp_path), max_upload_mb=5),
    )

    drink = SimpleNamespace(id="espresso", photo_url="/uploads/drinks/placeholder.jpg")
    session = FakeSession(entity=drink)
    photo = UploadFile(
        BytesIO(_jpeg_bytes(2400, 1800)),
        filename="huge.jpg",
        headers=Headers({"content-type": "image/jpeg"}),
    )

    result = asyncio.run(admin_uploads.upload_drink_photo(session, "espresso", photo))

    assert result["photo_url"].startswith("/uploads/drinks/espresso-")
    assert result["photo_url"].endswith(".webp")
    assert session.committed
    stored = tmp_path / "drinks" / result["photo_url"].rsplit("/", 1)[1]
    with Image.open(stored) as image:
        assert image.format == "WEBP"
        assert max(image.size) <= 1600


def test_upload_rejects_non_image_bytes(monkeypatch, tmp_path):
    from fastapi import HTTPException
    from starlette.datastructures import Headers, UploadFile

    from app.services import admin_uploads

    monkeypatch.setattr(
        admin_uploads,
        "get_settings",
        lambda: SimpleNamespace(upload_dir=str(tmp_path), max_upload_mb=5),
    )

    session = FakeSession(entity=SimpleNamespace(id="espresso", photo_url="x"))
    photo = UploadFile(
        BytesIO(b"definitely-not-an-image"),
        filename="fake.jpg",
        headers=Headers({"content-type": "image/jpeg"}),
    )

    with pytest.raises(HTTPException) as failure:
        asyncio.run(admin_uploads.upload_drink_photo(session, "espresso", photo))

    assert failure.value.status_code == 400


def test_update_order_status_records_transition_timestamp():
    from app.services.admin_orders import update_order_status

    order = SimpleNamespace(
        id=12,
        status="new",
        received_at=None,
        preparing_at=None,
        ready_at=None,
        cancelled_at=None,
    )
    session = FakeSession(entity=order)

    result = asyncio.run(update_order_status(session, 12, "preparing"))

    assert result["status"] == "preparing"
    assert order.preparing_at is not None
    assert order.preparing_at.tzinfo is not None
    assert order.received_at is None
    assert session.committed


def test_dashboard_summary_uses_grouped_status_counts():
    from app.services.admin_dashboard import get_dashboard_summary

    session = FakeSession(
        scalars=["true", 7, 3],
        execute_rows=[("new", 4), ("ready", 1)],
    )

    summary = asyncio.run(get_dashboard_summary(session))

    assert summary == {
        "new_orders_count": 4,
        "preparing_orders_count": 0,
        "ready_orders_count": 1,
        "orders_open": True,
        "available_drinks_count": 7,
        "available_beans_count": 3,
    }
