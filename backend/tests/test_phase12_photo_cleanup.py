import asyncio
from io import BytesIO
from types import SimpleNamespace

from PIL import Image


class FakeSession:
    def __init__(self, entity=None, still_referenced_by=None):
        self.entity = entity
        self.still_referenced_by = still_referenced_by
        self.committed = False

    async def get(self, _model, _key):
        return self.entity

    async def execute(self, _statement):
        value = self.still_referenced_by

        class Result:
            def scalar_one_or_none(self):
                return value

        return Result()

    async def commit(self):
        self.committed = True


def _patch_settings(monkeypatch, tmp_path):
    from app.services import admin_uploads

    monkeypatch.setattr(
        admin_uploads,
        "get_settings",
        lambda: SimpleNamespace(upload_dir=str(tmp_path), max_upload_mb=5),
    )


def _webp_upload():
    from starlette.datastructures import Headers, UploadFile

    buffer = BytesIO()
    Image.new("RGB", (32, 32), color=(186, 117, 23)).save(buffer, format="WEBP")
    buffer.seek(0)
    return UploadFile(
        buffer,
        filename="photo.webp",
        headers=Headers({"content-type": "image/webp"}),
    )


def test_generated_photo_filename_matches_only_own_generated_webp():
    from app.services.admin_uploads import _generated_photo_filename

    hex32 = "0" * 32
    assert (
        _generated_photo_filename("cortado", f"/uploads/drinks/cortado-{hex32}.webp")
        == f"cortado-{hex32}.webp"
    )
    # Curated/tracked assets and the placeholder must never match.
    assert _generated_photo_filename("cortado", "/uploads/drinks/placeholder.jpg") is None
    assert _generated_photo_filename("cortado", f"/uploads/drinks/cortado-{hex32}.png") is None
    # Another drink's generated file must never match.
    assert _generated_photo_filename("cortado", f"/uploads/drinks/espresso-{hex32}.webp") is None
    # Malformed or hostile URLs must never match.
    assert _generated_photo_filename("cortado", "") is None
    assert _generated_photo_filename("cortado", f"/uploads/drinks/../cortado-{hex32}.webp") is None
    assert (
        _generated_photo_filename("cortado", f"https://evil/uploads/drinks/cortado-{hex32}.webp")
        is None
    )
    assert _generated_photo_filename("cortado", f"/uploads/drinks/cortado-{hex32[:16]}.webp") is None


def test_replacing_generated_photo_deletes_old_file(monkeypatch, tmp_path):
    from app.services import admin_uploads

    _patch_settings(monkeypatch, tmp_path)
    old_name = f"cortado-{'a' * 32}.webp"
    drinks_dir = tmp_path / "drinks"
    drinks_dir.mkdir()
    (drinks_dir / old_name).write_bytes(b"old")
    drink = SimpleNamespace(id="cortado", photo_url=f"/uploads/drinks/{old_name}")
    session = FakeSession(entity=drink)

    result = asyncio.run(admin_uploads.upload_drink_photo(session, "cortado", _webp_upload()))

    assert session.committed
    assert result["photo_url"].startswith("/uploads/drinks/cortado-")
    assert not (drinks_dir / old_name).exists()
    new_name = result["photo_url"].rsplit("/", 1)[1]
    assert (drinks_dir / new_name).exists()


def test_replacing_curated_png_keeps_file(monkeypatch, tmp_path):
    from app.services import admin_uploads

    _patch_settings(monkeypatch, tmp_path)
    old_name = f"cortado-{'b' * 32}.png"
    drinks_dir = tmp_path / "drinks"
    drinks_dir.mkdir()
    (drinks_dir / old_name).write_bytes(b"curated")
    drink = SimpleNamespace(id="cortado", photo_url=f"/uploads/drinks/{old_name}")
    session = FakeSession(entity=drink)

    asyncio.run(admin_uploads.upload_drink_photo(session, "cortado", _webp_upload()))

    assert (drinks_dir / old_name).exists()


def test_replacing_placeholder_keeps_file(monkeypatch, tmp_path):
    from app.services import admin_uploads

    _patch_settings(monkeypatch, tmp_path)
    drinks_dir = tmp_path / "drinks"
    drinks_dir.mkdir()
    (drinks_dir / "placeholder.jpg").write_bytes(b"placeholder")
    drink = SimpleNamespace(id="cortado", photo_url="/uploads/drinks/placeholder.jpg")
    session = FakeSession(entity=drink)

    asyncio.run(admin_uploads.upload_drink_photo(session, "cortado", _webp_upload()))

    assert (drinks_dir / "placeholder.jpg").exists()


def test_photo_still_referenced_by_another_drink_is_kept(monkeypatch, tmp_path):
    from app.services import admin_uploads

    _patch_settings(monkeypatch, tmp_path)
    old_name = f"cortado-{'c' * 32}.webp"
    drinks_dir = tmp_path / "drinks"
    drinks_dir.mkdir()
    (drinks_dir / old_name).write_bytes(b"shared")
    drink = SimpleNamespace(id="cortado", photo_url=f"/uploads/drinks/{old_name}")
    session = FakeSession(entity=drink, still_referenced_by="other-drink")

    asyncio.run(admin_uploads.upload_drink_photo(session, "cortado", _webp_upload()))

    assert (drinks_dir / old_name).exists()


def test_missing_old_file_does_not_fail_upload(monkeypatch, tmp_path):
    from app.services import admin_uploads

    _patch_settings(monkeypatch, tmp_path)
    drink = SimpleNamespace(id="cortado", photo_url=f"/uploads/drinks/cortado-{'d' * 32}.webp")
    session = FakeSession(entity=drink)

    result = asyncio.run(admin_uploads.upload_drink_photo(session, "cortado", _webp_upload()))

    assert session.committed
    assert result["id"] == "cortado"
